import os
import io
from PIL import Image
import numpy as np
import logging
from transformers import BlipProcessor, BlipForConditionalGeneration
import colorsys

logger = logging.getLogger(__name__)

# Initialize BLIP model for crop detection
processor = None
blip_model = None

def load_blip_model():
    global processor, blip_model
    try:
        logger.info("Loading BLIP model for crop classification...")
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        logger.info("BLIP model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading BLIP model: {str(e)}")
        return False


def analyze_image_colors(image):
    """Analyze dominant colors in image to help with crop/health detection"""
    try:
        img_small = image.resize((100, 100))
        pixels = np.array(img_small)
        
        # Calculate color statistics
        avg_color = pixels.mean(axis=(0, 1))
        
        # Convert to HSV for better analysis
        r, g, b = avg_color[0]/255, avg_color[1]/255, avg_color[2]/255
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        
        # Detect greenness (healthy plants)
        green_ratio = avg_color[1] / (avg_color[0] + avg_color[2] + 1)
        brown_ratio = (avg_color[0] + avg_color[1]/2) / (avg_color[2] + 100)
        yellow_ratio = (avg_color[0] + avg_color[1]) / (avg_color[2] + 100)
        
        return {
            "green_ratio": float(green_ratio),
            "brown_ratio": float(brown_ratio),
            "yellow_ratio": float(yellow_ratio),
            "hue": float(h),
            "saturation": float(s),
            "brightness": float(v),
            "avg_rgb": [int(avg_color[0]), int(avg_color[1]), int(avg_color[2])]
        }
    except Exception as e:
        logger.error(f"Color analysis error: {e}")
        return None


def detect_plant_health(color_analysis, caption):
    """Detect plant health based on color analysis and caption"""
    if not color_analysis:
        return {"status": "unknown", "confidence": 0, "issues": []}
    
    issues = []
    health_score = 100
    
    caption_lower = caption.lower()
    
    # Check for disease/damage keywords (expanded list)
    severe_keywords = ["rotten", "rot", "rotting", "decayed", "decay", "mold", "moldy", "fungus", "dead", "destroyed", "ruined", "spoiled", "infected", "diseased", "bad", "damaged", "decomposed", "putrid", "contaminated", "inedible", "old", "stale"]
    moderate_keywords = ["brown", "yellow", "wilted", "wilting", "dried", "dry", "damaged", "spots", "spot", "blight", "lesion", "necrosis", "burnt", "scorched", "sick", "unhealthy", "dying", "withered", "blackened", "discolored"]
    mild_keywords = ["pale", "faded", "discolored", "weak", "stunted", "curled", "drooping", "limp"]
    
    # Severe disease indicators - major penalty
    for keyword in severe_keywords:
        if keyword in caption_lower:
            health_score -= 45
            issues.append(f"Severe issue: {keyword} detected")
    
    # Moderate disease indicators
    for keyword in moderate_keywords:
        if keyword in caption_lower:
            health_score -= 18
            issues.append(f"Possible issue: {keyword} in plant")
    
    # Mild indicators
    for keyword in mild_keywords:
        if keyword in caption_lower:
            health_score -= 10
            issues.append(f"Minor concern: {keyword}")
    
    # COLOR-BASED HEALTH ANALYSIS (More aggressive for rot detection)
    green_ratio = color_analysis.get("green_ratio", 0)
    brown_ratio = color_analysis.get("brown_ratio", 0)
    yellow_ratio = color_analysis.get("yellow_ratio", 0)
    saturation = color_analysis.get("saturation", 0.5)
    brightness = color_analysis.get("brightness", 0.5)
    hue = color_analysis.get("hue", 0)
    avg_rgb = color_analysis.get("avg_rgb", [128, 128, 128])
    
    # ROT/DECAY DETECTION (NEW - Aggressive check for rotten crops)
    # Rotten corn/crops typically have:
    # - Dark brown/black colors (low brightness, brown tones)
    # - Grayish/greenish mold colors
    # - Very low green ratio with high brown
    
    # Check for dark brown/rot colors (R > G > B pattern with low brightness)
    if avg_rgb[0] > avg_rgb[1] and avg_rgb[1] > avg_rgb[2]:  # Brown pattern
        brown_intensity = (avg_rgb[0] - avg_rgb[2]) / 255
        if brown_intensity > 0.15 and brightness < 0.5:
            health_score -= 35
            issues.append("Dark brown coloration - likely rot or decay")
        elif brown_intensity > 0.1 and brightness < 0.6:
            health_score -= 20
            issues.append("Brown discoloration detected")
    
    # Check for mold colors (greenish-gray, fuzzy appearance indicators)
    gray_diff = max(avg_rgb) - min(avg_rgb)
    if gray_diff < 30 and brightness < 0.4:
        health_score -= 30
        issues.append("Gray/moldy coloration - possible fungal infection")
    
    # Very dark images (rot, severe decay)
    if brightness < 0.25:
        health_score -= 40
        issues.append("Very dark coloration - severe decay or rot")
    
    # Check for very low green (likely diseased/rotten)
    if green_ratio < 0.25:
        health_score -= 35
        issues.append("Extremely low green - dead or rotting plant material")
    elif green_ratio < 0.3:
        health_score -= 25
        issues.append("Very low green color - likely diseased or dead plant material")
    elif green_ratio < 0.4:
        health_score -= 15
        issues.append("Low green color detected - possible stress or disease")
    elif green_ratio > 0.7:
        health_score += 10  # Very healthy green
    
    # Check for excessive brown (rot, disease, drought)
    if brown_ratio > 2.5:
        health_score -= 40
        issues.append("Extreme brown coloration - severe rot or disease")
    elif brown_ratio > 2.0:
        health_score -= 30
        issues.append("High brown coloration - possible rot or severe disease")
    elif brown_ratio > 1.5:
        health_score -= 15
        issues.append("Elevated brown color - possible drought stress or disease")
    
    # Check for yellowing with low green (nutrient deficiency or disease)
    if yellow_ratio > 2.5 and green_ratio < 0.4:
        health_score -= 20
        issues.append("Significant yellowing - possible disease or severe nutrient deficiency")
    elif yellow_ratio > 2.0 and green_ratio < 0.5:
        health_score -= 10
        issues.append("Yellowing detected - possible nitrogen deficiency or disease")
    
    # Dark/dull colors often indicate rot or decay
    if brightness < 0.3 and saturation < 0.3:
        health_score -= 25
        issues.append("Dark/dull coloration - possible decay or rot")
    
    # Check for gray/black tones (mold, severe rot)
    if avg_rgb[0] < 80 and avg_rgb[1] < 80 and avg_rgb[2] < 80:
        health_score -= 35
        issues.append("Very dark coloration - likely severe rot or mold")
    
    # Unnatural colors (not in healthy plant spectrum)
    # Healthy plants are usually in green-yellow hue range (0.15-0.45)
    if not (0.10 <= hue <= 0.50) and saturation > 0.3:
        health_score -= 15
        issues.append("Unusual coloration outside healthy plant spectrum")
    
    health_score = max(0, min(100, health_score))
    
    if health_score >= 80:
        status = "Healthy"
    elif health_score >= 60:
        status = "Moderate"
    elif health_score >= 40:
        status = "Stressed"
    elif health_score >= 20:
        status = "Diseased"
    else:
        status = "Critical/Rotten"
    
    return {
        "status": status,
        "score": health_score,
        "issues": issues[:5]  # Top 5 issues
    }


def detect_growth_stage(caption, crop):
    """Detect growth stage from caption and crop type"""
    caption_lower = caption.lower()
    
    # Growth stage keywords
    stage_keywords = {
        "seedling": ["seedling", "sprout", "young plant", "small plant", "germinating", "emerging"],
        "vegetative": ["growing", "leaves", "leafy", "green plant", "foliage", "vegetative"],
        "flowering": ["flower", "flowering", "bloom", "blossom", "pollinating"],
        "fruiting": ["fruit", "pod", "grain", "kernel", "ear", "head", "boll", "tuber"],
        "mature": ["ripe", "mature", "ready to harvest", "dried", "golden", "brown"]
    }
    
    for stage, keywords in stage_keywords.items():
        for keyword in keywords:
            if keyword in caption_lower:
                return stage.capitalize()
    
    return "Unknown"

def classify_crop_from_image(image_file):
    """
    Classify crop from uploaded image using BLIP model with enhanced analysis
    Returns: crop name, confidence, health status, growth stage, and recommendations
    """
    if processor is None or blip_model is None:
        return {
            "success": False,
            "error": "BLIP model not loaded. Please try again.",
            "crop": None,
            "confidence": 0
        }

    try:
        # Handle both bytes and file-like objects
        if isinstance(image_file, bytes):
            image = Image.open(io.BytesIO(image_file))
        else:
            image = Image.open(io.BytesIO(image_file.read()))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Analyze image colors for health detection
        color_analysis = analyze_image_colors(image)

        # Generate multiple captions with different prompts for better accuracy
        captions = []
        
        # Standard caption
        inputs = processor(images=image, return_tensors="pt")
        out = blip_model.generate(**inputs, max_length=50)
        caption1 = processor.decode(out[0], skip_special_tokens=True)
        captions.append(caption1)
        
        # Conditional caption with agricultural context
        prompts = [
            "This is a photo of a",
            "This field contains",
            "The crop in this image is",
            "The health condition of this plant is",
            "This image shows a plant that appears"
        ]
        
        for prompt in prompts:
            try:
                inputs = processor(images=image, text=prompt, return_tensors="pt")
                out = blip_model.generate(**inputs, max_length=50)
                caption = processor.decode(out[0], skip_special_tokens=True)
                captions.append(caption)
            except:
                pass
        
        # Disease-specific prompt to detect rot/disease
        disease_prompts = [
            "The plant condition is",
            "This crop looks"
        ]
        for prompt in disease_prompts:
            try:
                inputs = processor(images=image, text=prompt, return_tensors="pt")
                out = blip_model.generate(**inputs, max_length=30)
                caption = processor.decode(out[0], skip_special_tokens=True)
                captions.append(caption)
            except:
                pass

        # Combine all captions for better keyword matching
        combined_caption = " ".join(captions).lower()

        # Enhanced crop detection keywords with more variations
        crop_keywords = {
            "rice": ["rice", "paddy", "flooded field", "rice field", "rice crop", "rice paddy", "wet field", "grain crop"],
            "wheat": ["wheat", "grain field", "wheat crop", "cereal", "grain", "wheat field", "golden grain"],
            "maize": ["maize", "corn", "corn field", "corn crop", "maize field", "corn stalk", "cornfield"],
            "tomato": ["tomato", "tomatoes", "red fruit", "vegetable", "tomato plant", "tomato vine"],
            "potato": ["potato", "potatoes", "tubers", "root vegetable", "potato plant", "potato field"],
            "onion": ["onion", "onions", "bulb", "root crop", "onion field", "allium"],
            "coconut": ["coconut", "copra", "palm", "tender coconut", "coconut tree", "palm tree", "coconut palm"],
            "soybean": ["soybean", "soyabean", "soya bean", "legume", "soy", "soybean field"],
            "sugarcane": ["sugarcane", "sugar cane", "cane field", "cane", "sugar crop"],
            "cotton": ["cotton", "cotton field", "cotton plant", "cotton boll", "white boll"],
            "millets": ["millet", "pearl millet", "bajra", "sorghum", "jowar", "grain pods", "finger millet", "ragi"],
            "banana": ["banana", "banana plant", "plantain", "banana tree", "banana bunch"],
            "pepper": ["pepper", "black pepper", "chilli", "chili", "pepper vine", "capsicum"],
            "turmeric": ["turmeric", "haldi", "turmeric plant", "curcuma"],
            "ginger": ["ginger", "ginger root", "ginger plant", "zingiber"],
            "cardamom": ["cardamom", "elaichi", "cardamom plant", "spice plant"],
            "rubber": ["rubber", "rubber tree", "rubber plantation", "hevea"],
            "tea": ["tea", "tea plant", "tea garden", "tea plantation", "camellia"],
            "coffee": ["coffee", "coffee plant", "coffee beans", "coffee plantation"],
            "cashew": ["cashew", "cashew tree", "cashew nut", "anacardium"],
            "mango": ["mango", "mango tree", "mango fruit", "mangifera"],
            "jackfruit": ["jackfruit", "jack fruit", "jackfruit tree"]
        }

        detected_crop = None
        confidence_score = 0
        matched_keywords = []

        # Match keywords and calculate confidence with weighted scoring
        for crop, keywords in crop_keywords.items():
            crop_matches = 0
            for keyword in keywords:
                count = combined_caption.count(keyword)
                if count > 0:
                    crop_matches += count * len(keyword.split())
                    matched_keywords.append(keyword)
            
            if crop_matches > confidence_score:
                detected_crop = crop
                confidence_score = crop_matches

        # Normalize confidence to 0-100 scale
        confidence_score = min(95, max(30, confidence_score * 15 + 25))

        # Detect plant health
        health_info = detect_plant_health(color_analysis, combined_caption)
        
        # Detect growth stage
        growth_stage = detect_growth_stage(combined_caption, detected_crop)

        # Get disease-specific recommendations if health issues detected
        disease_recommendations = []
        if health_info["issues"]:
            disease_recommendations = get_disease_recommendations(detected_crop, health_info["issues"])

        result = {
            "success": True,
            "crop": detected_crop.capitalize() if detected_crop else "Unknown",
            "confidence": confidence_score,
            "caption": caption1,
            "all_captions": captions[:3],
            "description": f"Image analysis detected: {caption1}",
            "health": health_info,
            "growth_stage": growth_stage,
            "color_analysis": color_analysis,
            "recommendations": get_crop_recommendations(detected_crop) if detected_crop else [],
            "disease_recommendations": disease_recommendations,
            "matched_keywords": list(set(matched_keywords))[:5]
        }

        logger.info(f"Enhanced crop classification result: {result}")
        return result

    except Exception as e:
        logger.error(f"Error classifying crop: {str(e)}")
        return {
            "success": False,
            "error": f"Error processing image: {str(e)}",
            "crop": None,
            "confidence": 0
        }


def get_disease_recommendations(crop, issues):
    """Get disease-specific recommendations based on detected issues"""
    recommendations = []
    
    disease_treatments = {
        "yellow": [
            "Apply nitrogen-rich fertilizer (urea) at recommended rates",
            "Check soil pH - optimal range is 6.0-7.0 for most crops",
            "Ensure adequate irrigation to prevent nutrient lockout"
        ],
        "brown": [
            "Reduce irrigation if overwatering is suspected",
            "Apply fungicide if fungal infection is suspected",
            "Remove severely affected plant parts to prevent spread"
        ],
        "rot": [
            "Remove and destroy all rotting/affected plant material immediately",
            "Apply copper-based fungicide to prevent spread",
            "Improve drainage - avoid waterlogging",
            "Do not consume or use rotten/infected plant parts"
        ],
        "rotten": [
            "Dispose of rotten material away from healthy plants",
            "Apply systemic fungicide (e.g., carbendazim)",
            "Check for proper storage conditions if post-harvest",
            "Inspect other plants for early signs of infection"
        ],
        "mold": [
            "Remove moldy material and dispose safely",
            "Apply fungicide like mancozeb",
            "Improve air circulation and reduce humidity",
            "Store produce in cool, dry conditions"
        ],
        "decay": [
            "Remove and burn affected plant parts",
            "Apply fungicide as preventive measure",
            "Avoid injuring healthy plants during harvest",
            "Inspect storage areas for moisture issues"
        ],
        "wilted": [
            "Check soil moisture - may need more or less water",
            "Inspect roots for rot or pest damage",
            "Provide shade during extreme heat conditions"
        ],
        "spots": [
            "Apply appropriate fungicide based on spot characteristics",
            "Improve air circulation around plants",
            "Avoid overhead watering to reduce leaf wetness"
        ],
        "stress": [
            "Ensure consistent watering schedule",
            "Apply balanced NPK fertilizer",
            "Check for pest infestation and treat accordingly"
        ]
    }
    
    for issue in issues:
        issue_lower = issue.lower()
        for keyword, treatments in disease_treatments.items():
            if keyword in issue_lower:
                recommendations.extend(treatments[:2])
                break
    
    return list(set(recommendations))[:5]


def get_crop_recommendations(crop):
    """Get basic recommendations for detected crop"""
    recommendations = {
        "rice": [
            "Maintain flooded field conditions during vegetative stage",
            "Apply nitrogen fertilizer at tillering stage",
            "Monitor for rice blast and sheath blight diseases",
            "Harvest when grain moisture is 20-25%"
        ],
        "wheat": [
            "Ensure proper soil drainage",
            "Apply urea fertilizer at boot stage",
            "Monitor for Septoria and rust diseases",
            "Harvest when grain is hard (cannot be dented with fingernail)"
        ],
        "maize": [
            "Maintain adequate soil moisture",
            "Apply zinc sulphate if deficiency symptoms appear",
            "Monitor for fall armyworm and other pests",
            "Harvest when kernels are dented and dry"
        ],
        "tomato": [
            "Provide regular irrigation and support structures",
            "Apply balanced NPK fertilizer every 2 weeks",
            "Monitor for early and late blight",
            "Harvest when tomatoes are fully colored"
        ],
        "potato": [
            "Ensure good soil drainage and aeration",
            "Hill up soil as plants grow",
            "Monitor for late blight and aphids",
            "Harvest after foliage dies down"
        ],
        "onion": [
            "Ensure well-drained fertile soil",
            "Maintain consistent moisture levels",
            "Monitor for purple blotch and basal rot",
            "Harvest when tops dry and fall over"
        ],
        "coconut": [
            "Provide adequate irrigation in dry season",
            "Apply organic manure and potassium rich fertilizers",
            "Monitor for scale insects and rhinoceros beetle",
            "Harvest mature nuts at 12 month intervals"
        ],
        "soybean": [
            "Ensure well-drained soil",
            "Monitor for rust and leaf spot diseases",
            "Apply phosphorus fertilizer for pod development",
            "Harvest when pods turn brown and rattle when shaken"
        ],
        "sugarcane": [
            "Maintain optimum soil moisture",
            "Apply organic manure and potassium fertilizer",
            "Monitor for red rot and leaf scald diseases",
            "Harvest at 10-12 months of growth"
        ],
        "cotton": [
            "Ensure good drainage",
            "Monitor for bollworms and pink bollworms",
            "Apply phosphorus and potassium for boll development",
            "Harvest when bolls open naturally"
        ],
        "millets": [
            "Ensure soil has good drainage; millets are drought-tolerant but sensitive to waterlogging.",
            "Apply nitrogen in two splits: at sowing and 30 days later.",
            "Monitor for downy mildew and ergot diseases.",
            "Harvest when the grain moisture drops to about 12-15%."
        ]
    }
    return recommendations.get(crop.lower(), [])

# Initialize on startup
def initialize():
    load_blip_model()
