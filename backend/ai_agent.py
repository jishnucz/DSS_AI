"""
🤖 AI ADVISORY AGENT - Multi-Agent RAG System
==============================================
Retrieval-Augmented Generation for Agricultural Decision Support

Features:
1. Knowledge Base Indexing - Embeds local CSV data for semantic search
2. Multi-Agent Architecture - Specialized agents for different tasks
3. Reasoning Engine - Chains thoughts with ML model predictions
4. Citation System - Tracks data sources for transparency

Architecture:
    Query → Intent Classification → Agent Selection → 
    [Knowledge Retrieval + ML Prediction] → Reasoning → Response

Author: AgriDSS Research Team
Date: March 2026
"""

import os
import json
import re
import math
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from enum import Enum

# Import ML capabilities
try:
    from advanced_api import get_all_models_prediction, get_shap_explanation
except ImportError:
    get_all_models_prediction = None
    get_shap_explanation = None

# Paths
DATA_DIR = Path(__file__).parent.parent / "data"


# ==================== DATA CLASSES ====================

class AgentType(Enum):
    WEATHER = "weather"
    CROP_HEALTH = "crop_health"
    MARKET = "market"
    IRRIGATION = "irrigation"
    GENERAL = "general"


@dataclass
class Citation:
    """Source citation for transparency"""
    source: str
    record_type: str
    confidence: float
    excerpt: str


@dataclass
class ReasoningStep:
    """Single step in agent's chain-of-thought"""
    step_number: int
    thought: str
    action: str
    observation: str


@dataclass
class AgentResponse:
    """Structured response from AI agent"""
    answer: str
    confidence: float
    agent_type: str
    reasoning_steps: List[Dict]
    citations: List[Dict]
    ml_prediction: Optional[Dict]
    recommendations: List[str]
    follow_up_questions: List[str]


# ==================== KNOWLEDGE BASE ====================

class KnowledgeBase:
    """
    Local knowledge base using CSV data.
    Implements semantic-like search using TF-IDF style matching.
    """
    
    def __init__(self):
        self.documents = []
        self.crop_data = {}
        self.stress_thresholds = {}
        self.climate_knowledge = {}
        self.taluk_data = {}
        self._load_knowledge()
    
    def _load_knowledge(self):
        """Load all CSV data into searchable format"""
        
        # 1. Crop Climate Knowledge
        path = DATA_DIR / "palakkad_crop_climate_knowledge.csv"
        if path.exists():
            df = pd.read_csv(path)
            for _, row in df.iterrows():
                doc = {
                    "type": "crop_climate",
                    "crop": row.get("Crop", ""),
                    "season": row.get("Season", ""),
                    "stage": row.get("Growth_Stage", ""),
                    "temp_range": row.get("Temperature_Range_C", ""),
                    "rainfall": row.get("Rainfall_Requirement", ""),
                    "wind_risk": row.get("Wind_Risk", ""),
                    "source": row.get("Source", ""),
                    "text": f"{row.get('Crop', '')} during {row.get('Growth_Stage', '')} stage requires temperature {row.get('Temperature_Range_C', '')}°C with {row.get('Rainfall_Requirement', '')} rainfall. Wind risk is {row.get('Wind_Risk', '')}.",
                }
                self.documents.append(doc)
                
                # Index by crop
                crop = row.get("Crop", "").lower()
                if crop not in self.crop_data:
                    self.crop_data[crop] = []
                self.crop_data[crop].append(row.to_dict())
        
        # 2. Stress Thresholds
        path = DATA_DIR / "palakkad_crop_stress_thresholds.csv"
        if path.exists():
            df = pd.read_csv(path)
            for _, row in df.iterrows():
                doc = {
                    "type": "stress_threshold",
                    "crop_id": row.get("crop_id", ""),
                    "stage": row.get("stage_name", ""),
                    "variable": row.get("variable", ""),
                    "optimal_min": row.get("optimal_min", 0),
                    "optimal_max": row.get("optimal_max", 0),
                    "stress_low": row.get("stress_threshold_low", 0),
                    "stress_high": row.get("stress_threshold_high", 0),
                    "stress_type": row.get("stress_type", ""),
                    "text": f"For {row.get('stage_name', '')} stage, {row.get('variable', '')} should be between {row.get('optimal_min', 0)}-{row.get('optimal_max', 0)}. Values below {row.get('stress_threshold_low', 0)} or above {row.get('stress_threshold_high', 0)} cause {row.get('stress_type', '')} stress.",
                }
                self.documents.append(doc)
                
                # Index thresholds
                stage = row.get("stage_name", "")
                if stage not in self.stress_thresholds:
                    self.stress_thresholds[stage] = []
                self.stress_thresholds[stage].append(row.to_dict())
        
        # 3. Rice Stage Calendar
        path = DATA_DIR / "palakkad_rice_stage_calendar.csv"
        if path.exists():
            df = pd.read_csv(path)
            for _, row in df.iterrows():
                doc = {
                    "type": "rice_calendar",
                    "text": f"Rice {row.get('stage_name', '')} stage occurs from day {row.get('day_start', 0)} to {row.get('day_end', 0)}. Duration: {row.get('duration_days', 0)} days.",
                }
                self.documents.append(doc)
        
        # 4. Taluk Crop Map
        path = DATA_DIR / "palakkad_taluk_crop_map.csv"
        if path.exists():
            df = pd.read_csv(path)
            for _, row in df.iterrows():
                taluk = row.get("taluk_name", "")
                doc = {
                    "type": "taluk_info",
                    "taluk": taluk,
                    "crop": row.get("major_crop", ""),
                    "area": row.get("area_hectares", 0),
                    "text": f"{taluk} taluk primarily grows {row.get('major_crop', '')} covering {row.get('area_hectares', 0)} hectares.",
                }
                self.documents.append(doc)
                self.taluk_data[taluk.lower()] = row.to_dict()
        
        # 5. Agro Context
        path = DATA_DIR / "palakkad_agro_context.csv"
        if path.exists():
            df = pd.read_csv(path)
            for _, row in df.iterrows():
                doc = {
                    "type": "agro_context",
                    "text": f"{row.get('parameter', '')}: {row.get('value', '')}",
                }
                self.documents.append(doc)
        
        print(f"📚 Loaded {len(self.documents)} knowledge documents")
    
    def search(self, query: str, top_k: int = 5) -> List[Tuple[Dict, float]]:
        """
        Search knowledge base using keyword matching with TF-IDF-like scoring.
        Returns list of (document, score) tuples.
        """
        query_terms = set(query.lower().split())
        results = []
        
        for doc in self.documents:
            text = doc.get("text", "").lower()
            doc_terms = set(text.split())
            
            # Calculate Jaccard-like similarity
            intersection = len(query_terms & doc_terms)
            union = len(query_terms | doc_terms)
            score = intersection / union if union > 0 else 0
            
            # Boost exact matches
            for term in query_terms:
                if term in text:
                    score += 0.1
            
            if score > 0:
                results.append((doc, score))
        
        # Sort by score and return top-k
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    def get_crop_info(self, crop: str) -> List[Dict]:
        """Get all info about a specific crop"""
        return self.crop_data.get(crop.lower(), [])
    
    def get_stress_thresholds_for_stage(self, stage: str) -> List[Dict]:
        """Get stress thresholds for a growth stage"""
        return self.stress_thresholds.get(stage, [])
    
    def get_taluk_info(self, taluk: str) -> Optional[Dict]:
        """Get info about a specific taluk"""
        return self.taluk_data.get(taluk.lower())


# ==================== SPECIALIZED AGENTS ====================

class BaseAgent:
    """Base class for all specialized agents"""
    
    def __init__(self, kb: KnowledgeBase):
        self.kb = kb
        self.agent_type = AgentType.GENERAL
        self.reasoning_steps = []
    
    def add_reasoning_step(self, thought: str, action: str, observation: str):
        """Add a step to chain of thought"""
        step = ReasoningStep(
            step_number=len(self.reasoning_steps) + 1,
            thought=thought,
            action=action,
            observation=observation
        )
        self.reasoning_steps.append(asdict(step))
    
    def reset(self):
        """Reset reasoning chain"""
        self.reasoning_steps = []


class CropHealthAgent(BaseAgent):
    """Agent specialized in crop health analysis"""
    
    def __init__(self, kb: KnowledgeBase):
        super().__init__(kb)
        self.agent_type = AgentType.CROP_HEALTH
    
    def analyze(self, crop: str, stage: str, temp: float = None, 
                soil_moisture: float = None, rainfall: float = None) -> Dict:
        """Analyze crop health based on conditions"""
        self.reset()
        
        # Step 1: Retrieve crop knowledge
        self.add_reasoning_step(
            thought=f"I need to understand {crop}'s requirements during {stage} stage",
            action="search_knowledge_base",
            observation=f"Searching for {crop} {stage} requirements..."
        )
        
        crop_info = self.kb.get_crop_info(crop)
        stage_thresholds = self.kb.get_stress_thresholds_for_stage(stage)
        
        # Step 2: Check current conditions against thresholds
        stress_indicators = []
        recommendations = []
        
        if temp is not None:
            self.add_reasoning_step(
                thought=f"Current temperature is {temp}°C. Need to check optimal range.",
                action="check_temperature_thresholds",
                observation=f"Comparing {temp}°C against known thresholds..."
            )
            
            # Find temperature thresholds
            for th in stage_thresholds:
                if th.get("variable") in ["AirTemp", "Temperature"]:
                    opt_min = th.get("optimal_min", 20)
                    opt_max = th.get("optimal_max", 35)
                    stress_high = th.get("stress_threshold_high", 38)
                    
                    if temp < opt_min:
                        stress_indicators.append(f"Temperature {temp}°C is below optimal ({opt_min}°C)")
                        recommendations.append("Consider protective measures against cold stress")
                    elif temp > opt_max:
                        stress_indicators.append(f"Temperature {temp}°C is above optimal ({opt_max}°C)")
                        if temp > stress_high:
                            recommendations.append("URGENT: High temperature stress - increase irrigation frequency")
                        else:
                            recommendations.append("Monitor crop closely, consider shade or irrigation cooling")
        
        if soil_moisture is not None:
            self.add_reasoning_step(
                thought=f"Soil moisture is {soil_moisture}. Checking moisture requirements.",
                action="check_moisture_thresholds", 
                observation=f"Analyzing soil moisture level..."
            )
            
            # Convert if percentage
            sm = soil_moisture / 100 if soil_moisture > 1 else soil_moisture
            
            for th in stage_thresholds:
                if th.get("variable") == "SoilMoisture":
                    opt_min = th.get("optimal_min", 0.25)
                    opt_max = th.get("optimal_max", 0.45)
                    
                    if sm < opt_min:
                        stress_indicators.append(f"Soil moisture {sm:.2f} is below optimal ({opt_min})")
                        recommendations.append("Increase irrigation - soil is too dry")
                    elif sm > opt_max:
                        stress_indicators.append(f"Soil moisture {sm:.2f} is above optimal ({opt_max})")
                        recommendations.append("Reduce irrigation to prevent waterlogging")
        
        # Step 3: Get ML prediction if available
        ml_prediction = None
        if get_all_models_prediction is not None and temp is not None:
            self.add_reasoning_step(
                thought="I should run the ML ensemble to get stress prediction",
                action="run_ml_models",
                observation="Running 8-model ensemble prediction..."
            )
            
            try:
                ml_result = get_all_models_prediction(
                    temp=temp,
                    precip=rainfall or 5.0,
                    soil=soil_moisture or 0.35,
                    wind=3.0,
                    pressure=1013.0
                )
                ml_prediction = ml_result
            except Exception as e:
                print(f"ML prediction error: {e}")
        
        # Step 4: Synthesize findings
        self.add_reasoning_step(
            thought="Now I need to combine all findings into a coherent assessment",
            action="synthesize_analysis",
            observation=f"Found {len(stress_indicators)} stress indicators, {len(recommendations)} recommendations"
        )
        
        # Calculate overall health score
        health_score = 100
        for _ in stress_indicators:
            health_score -= 15
        health_score = max(0, health_score)
        
        health_status = "Healthy" if health_score >= 70 else "Stressed" if health_score >= 40 else "Critical"
        
        return {
            "crop": crop,
            "stage": stage,
            "health_status": health_status,
            "health_score": health_score,
            "stress_indicators": stress_indicators,
            "recommendations": recommendations,
            "ml_prediction": ml_prediction,
            "reasoning_steps": self.reasoning_steps
        }


class IrrigationAgent(BaseAgent):
    """Agent specialized in irrigation recommendations"""
    
    def __init__(self, kb: KnowledgeBase):
        super().__init__(kb)
        self.agent_type = AgentType.IRRIGATION
    
    def recommend(self, crop: str, soil_moisture: float, recent_rainfall: float, forecast_rain: bool) -> Dict:
        """Generate irrigation recommendations"""
        self.reset()
        
        # Step 1: Assess current water status
        self.add_reasoning_step(
            thought=f"Soil moisture is {soil_moisture}%, rainfall was {recent_rainfall}mm. Need to assess water needs.",
            action="assess_water_status",
            observation="Analyzing water balance..."
        )
        
        sm = soil_moisture / 100 if soil_moisture > 1 else soil_moisture
        
        # Step 2: Check crop water requirements
        self.add_reasoning_step(
            thought=f"Looking up water requirements for {crop}",
            action="lookup_crop_requirements",
            observation="Retrieving crop water needs..."
        )
        
        # Water need based on crop type
        crop_water_needs = {
            "rice": {"optimal": 0.4, "critical_low": 0.25, "method": "flood"},
            "banana": {"optimal": 0.35, "critical_low": 0.2, "method": "drip"},
            "coconut": {"optimal": 0.3, "critical_low": 0.15, "method": "basin"},
        }
        
        needs = crop_water_needs.get(crop.lower(), {"optimal": 0.35, "critical_low": 0.2, "method": "sprinkler"})
        
        # Step 3: Generate recommendation
        recommendations = []
        irrigation_needed = False
        urgency = "low"
        
        if sm < needs["critical_low"]:
            irrigation_needed = True
            urgency = "high"
            recommendations.append(f"URGENT: Soil moisture critically low ({sm:.0%}). Irrigate immediately.")
            recommendations.append(f"Recommended method: {needs['method']} irrigation")
            recommendations.append("Apply water until soil moisture reaches 35-40%")
        elif sm < needs["optimal"]:
            irrigation_needed = True
            urgency = "medium"
            if forecast_rain:
                recommendations.append(f"Soil moisture is low ({sm:.0%}) but rain is forecasted. Wait 24 hours.")
            else:
                recommendations.append(f"Soil moisture below optimal ({sm:.0%}). Schedule irrigation within 2-3 days.")
        else:
            if forecast_rain:
                recommendations.append(f"Soil moisture adequate ({sm:.0%}) and rain expected. Skip irrigation.")
            else:
                recommendations.append(f"Soil moisture adequate ({sm:.0%}). Next check in 3-4 days.")
        
        self.add_reasoning_step(
            thought="Generating final irrigation schedule",
            action="create_schedule",
            observation=f"Irrigation needed: {irrigation_needed}, Urgency: {urgency}"
        )
        
        return {
            "irrigation_needed": irrigation_needed,
            "urgency": urgency,
            "current_moisture": soil_moisture,
            "optimal_moisture": needs["optimal"] * 100,
            "recommended_method": needs["method"],
            "recommendations": recommendations,
            "reasoning_steps": self.reasoning_steps
        }


class WeatherAgent(BaseAgent):
    """Agent for weather analysis and alerts"""
    
    def __init__(self, kb: KnowledgeBase):
        super().__init__(kb)
        self.agent_type = AgentType.WEATHER
    
    def analyze_conditions(self, temp: float, humidity: float, wind: float, 
                          rainfall: float, crop: str) -> Dict:
        """Analyze weather conditions for farming"""
        self.reset()
        
        alerts = []
        recommendations = []
        
        # Temperature analysis
        self.add_reasoning_step(
            thought=f"Current temperature is {temp}°C. Checking for extremes.",
            action="analyze_temperature",
            observation="Evaluating temperature stress risk..."
        )
        
        if temp > 38:
            alerts.append({"type": "heat_wave", "severity": "high", "message": f"Extreme heat: {temp}°C"})
            recommendations.append("Apply foliar spray in early morning to reduce heat stress")
            recommendations.append("Increase irrigation frequency")
        elif temp > 35:
            alerts.append({"type": "high_temp", "severity": "medium", "message": f"High temperature: {temp}°C"})
            recommendations.append("Monitor crops for wilting")
        elif temp < 15:
            alerts.append({"type": "cold_stress", "severity": "medium", "message": f"Low temperature: {temp}°C"})
            recommendations.append("Consider protective covers for sensitive crops")
        
        # Wind analysis
        self.add_reasoning_step(
            thought=f"Wind speed is {wind} km/h. Checking impact on crops.",
            action="analyze_wind",
            observation="Evaluating wind damage risk..."
        )
        
        if wind > 50:
            alerts.append({"type": "strong_wind", "severity": "high", "message": f"Strong winds: {wind} km/h"})
            recommendations.append("Stake tall plants and provide wind breaks")
            recommendations.append("Postpone spraying operations")
        elif wind > 30:
            alerts.append({"type": "windy", "severity": "low", "message": f"Moderate winds: {wind} km/h"})
        
        # Rainfall analysis
        self.add_reasoning_step(
            thought=f"Rainfall is {rainfall}mm. Checking for flooding or drought.",
            action="analyze_rainfall",
            observation="Evaluating water balance..."
        )
        
        if rainfall > 100:
            alerts.append({"type": "heavy_rain", "severity": "high", "message": f"Heavy rainfall: {rainfall}mm"})
            recommendations.append("Ensure proper drainage to prevent waterlogging")
            recommendations.append("Postpone fertilizer application")
        elif rainfall < 2 and humidity < 40:
            alerts.append({"type": "dry", "severity": "medium", "message": "Dry conditions detected"})
            recommendations.append("Check soil moisture and irrigate if needed")
        
        # Overall assessment
        severity_weights = {"high": 3, "medium": 2, "low": 1}
        total_severity = sum(severity_weights.get(a["severity"], 0) for a in alerts)
        
        if total_severity >= 5:
            overall_status = "Adverse"
        elif total_severity >= 2:
            overall_status = "Caution"
        else:
            overall_status = "Favorable"
        
        self.add_reasoning_step(
            thought="Synthesizing weather assessment",
            action="create_summary",
            observation=f"Overall conditions: {overall_status}"
        )
        
        return {
            "overall_status": overall_status,
            "temperature": temp,
            "humidity": humidity,
            "wind": wind,
            "rainfall": rainfall,
            "alerts": alerts,
            "recommendations": recommendations,
            "reasoning_steps": self.reasoning_steps
        }


# ==================== COORDINATOR AGENT ====================

class AgriAdvisorCoordinator:
    """
    Main coordinator that orchestrates all specialized agents.
    Implements intent classification and agent routing.
    """
    
    def __init__(self):
        self.kb = KnowledgeBase()
        self.crop_agent = CropHealthAgent(self.kb)
        self.irrigation_agent = IrrigationAgent(self.kb)
        self.weather_agent = WeatherAgent(self.kb)
        
        # Intent patterns - more specific patterns first
        self.intent_patterns = {
            AgentType.CROP_HEALTH: [
                r"crop\s+health", r"plant\s+stress", r"disease", r"yellowing",
                r"wilting", r"growth", r"stage", r"status", r"yellow\s+leaves",
                r"brown\s+leaves", r"leaf\s+spot", r"pest", r"insect", r"fungus",
                r"nutrient", r"deficiency", r"my\s+crop", r"my\s+rice", r"my\s+banana",
                r"leaves\s+are", r"showing", r"symptoms"
            ],
            AgentType.IRRIGATION: [
                r"irrigat", r"water", r"moisture", r"dry", r"drought",
                r"when\s+to\s+water", r"how\s+much\s+water", r"soil\s+moisture"
            ],
            AgentType.WEATHER: [
                r"weather\s+forecast", r"weather\s+today", r"will\s+it\s+rain",
                r"rain\s+forecast", r"weather\s+alert", r"climate\s+change",
                r"^weather$", r"what.*weather"
            ],
            AgentType.MARKET: [
                r"price", r"market", r"sell", r"profit", r"cost"
            ]
        }
    
    def classify_intent(self, query: str) -> AgentType:
        """Classify user query to determine which agent to use"""
        query_lower = query.lower()
        
        # Priority keywords that force agent selection
        if any(kw in query_lower for kw in ["my crop", "my rice", "my banana", "yellow leaves", "wilting", "stress", "disease"]):
            return AgentType.CROP_HEALTH
        if any(kw in query_lower for kw in ["when to irrigate", "irrigation schedule", "water my"]):
            return AgentType.IRRIGATION
        
        scores = {}
        for agent_type, patterns in self.intent_patterns.items():
            score = sum(1 for p in patterns if re.search(p, query_lower))
            # Weight crop health higher when "leaves" mentioned
            if agent_type == AgentType.CROP_HEALTH and "leaves" in query_lower:
                score += 2
            scores[agent_type] = score
        
        # Get highest scoring agent
        best_agent = max(scores.items(), key=lambda x: x[1])
        
        if best_agent[1] > 0:
            return best_agent[0]
        return AgentType.GENERAL
    
    def extract_parameters(self, query: str) -> Dict:
        """Extract relevant parameters from query"""
        params = {}
        
        # Extract crop
        crops = ["rice", "banana", "coconut", "sugarcane", "groundnut", "maize", "wheat"]
        for crop in crops:
            if crop in query.lower():
                params["crop"] = crop
                break
        
        # Extract temperature
        temp_match = re.search(r'(\d+)\s*°?C', query)
        if temp_match:
            params["temperature"] = float(temp_match.group(1))
        
        # Extract moisture
        moisture_match = re.search(r'moisture\s*(?:is\s*)?(\d+(?:\.\d+)?)\s*%?', query.lower())
        if moisture_match:
            params["soil_moisture"] = float(moisture_match.group(1))
        
        # Extract growth stage
        stages = ["germination", "vegetative", "flowering", "grain filling", "maturity", "tillering"]
        for stage in stages:
            if stage in query.lower():
                params["stage"] = stage.title()
                break
        
        return params
    
    def query(self, user_query: str, context: Dict = None) -> AgentResponse:
        """
        Main entry point - processes user query and returns response.
        
        Args:
            user_query: Natural language question from user
            context: Optional context (current conditions, crop info, etc.)
        """
        context = context or {}
        
        # Step 1: Classify intent
        intent = self.classify_intent(user_query)
        
        # Step 2: Extract parameters from query
        params = self.extract_parameters(user_query)
        params.update(context)  # Merge with any provided context
        
        # Step 3: Search knowledge base
        kb_results = self.kb.search(user_query, top_k=3)
        citations = []
        for doc, score in kb_results:
            citations.append(Citation(
                source=doc.get("source", doc.get("type", "Knowledge Base")),
                record_type=doc.get("type", ""),
                confidence=score,
                excerpt=doc.get("text", "")[:200]
            ))
        
        # Step 4: Route to appropriate agent
        answer = ""
        reasoning_steps = []
        recommendations = []
        ml_prediction = None
        
        if intent == AgentType.CROP_HEALTH:
            crop = params.get("crop", "rice")
            stage = params.get("stage", "Vegetative")
            result = self.crop_agent.analyze(
                crop=crop,
                stage=stage,
                temp=params.get("temperature"),
                soil_moisture=params.get("soil_moisture"),
                rainfall=params.get("rainfall")
            )
            
            answer = f"**Crop Health Assessment for {crop.title()}**\n\n"
            answer += f"🌱 **Status**: {result['health_status']} (Score: {result['health_score']}/100)\n\n"
            
            if result['stress_indicators']:
                answer += "⚠️ **Stress Indicators**:\n"
                for si in result['stress_indicators']:
                    answer += f"- {si}\n"
                answer += "\n"
            
            if result['recommendations']:
                answer += "💡 **Recommendations**:\n"
                for rec in result['recommendations']:
                    answer += f"- {rec}\n"
            
            reasoning_steps = result['reasoning_steps']
            recommendations = result['recommendations']
            ml_prediction = result.get('ml_prediction')
            
        elif intent == AgentType.IRRIGATION:
            crop = params.get("crop", "rice")
            sm = params.get("soil_moisture", 30)
            result = self.irrigation_agent.recommend(
                crop=crop,
                soil_moisture=sm,
                recent_rainfall=params.get("rainfall", 0),
                forecast_rain=params.get("forecast_rain", False)
            )
            
            answer = f"**Irrigation Recommendation for {crop.title()}**\n\n"
            answer += f"💧 **Current Moisture**: {result['current_moisture']}%\n"
            answer += f"🎯 **Optimal Moisture**: {result['optimal_moisture']}%\n"
            answer += f"⏰ **Urgency**: {result['urgency'].upper()}\n\n"
            
            if result['recommendations']:
                answer += "💡 **Recommendations**:\n"
                for rec in result['recommendations']:
                    answer += f"- {rec}\n"
            
            reasoning_steps = result['reasoning_steps']
            recommendations = result['recommendations']
            
        elif intent == AgentType.WEATHER:
            result = self.weather_agent.analyze_conditions(
                temp=params.get("temperature", 28),
                humidity=params.get("humidity", 70),
                wind=params.get("wind", 10),
                rainfall=params.get("rainfall", 0),
                crop=params.get("crop", "rice")
            )
            
            answer = f"**Weather Analysis**\n\n"
            answer += f"🌡️ **Temperature**: {result['temperature']}°C\n"
            answer += f"💨 **Wind**: {result['wind']} km/h\n"
            answer += f"🌧️ **Rainfall**: {result['rainfall']} mm\n"
            answer += f"📊 **Overall**: {result['overall_status']}\n\n"
            
            if result['alerts']:
                answer += "🚨 **Alerts**:\n"
                for alert in result['alerts']:
                    answer += f"- [{alert['severity'].upper()}] {alert['message']}\n"
                answer += "\n"
            
            if result['recommendations']:
                answer += "💡 **Recommendations**:\n"
                for rec in result['recommendations']:
                    answer += f"- {rec}\n"
            
            reasoning_steps = result['reasoning_steps']
            recommendations = result['recommendations']
            
        else:
            # General query - use knowledge base directly
            answer = "Based on the Palakkad Agricultural Knowledge Base:\n\n"
            
            if kb_results:
                for doc, score in kb_results[:3]:
                    answer += f"- {doc.get('text', '')}\n\n"
            else:
                answer = "I couldn't find specific information about that. Could you please rephrase your question or ask about specific crops, irrigation, or weather conditions?"
        
        # Generate follow-up questions
        follow_ups = self._generate_follow_ups(intent, params)
        
        # Calculate overall confidence
        confidence = 0.85
        if kb_results:
            confidence = min(0.95, 0.7 + sum(s for _, s in kb_results[:3]) / 3)
        
        return AgentResponse(
            answer=answer,
            confidence=confidence,
            agent_type=intent.value,
            reasoning_steps=reasoning_steps,
            citations=[asdict(c) for c in citations],
            ml_prediction=ml_prediction,
            recommendations=recommendations,
            follow_up_questions=follow_ups
        )
    
    def _generate_follow_ups(self, intent: AgentType, params: Dict) -> List[str]:
        """Generate contextual follow-up questions"""
        follow_ups = []
        
        crop = params.get("crop", "rice")
        
        if intent == AgentType.CROP_HEALTH:
            follow_ups = [
                f"What are the common diseases affecting {crop}?",
                "How can I improve soil health?",
                "When should I apply fertilizer?"
            ]
        elif intent == AgentType.IRRIGATION:
            follow_ups = [
                f"What is the best irrigation method for {crop}?",
                "How often should I check soil moisture?",
                "What are signs of overwatering?"
            ]
        elif intent == AgentType.WEATHER:
            follow_ups = [
                "What crops are best suited for current weather?",
                "How can I protect crops from heat stress?",
                "When is the best time to spray pesticides?"
            ]
        else:
            follow_ups = [
                "What is the current crop health status?",
                "When should I irrigate?",
                "What weather alerts are active?"
            ]
        
        return follow_ups


# ==================== API FUNCTIONS ====================

# Global coordinator instance
_coordinator = None

def get_coordinator() -> AgriAdvisorCoordinator:
    """Get or create the coordinator singleton"""
    global _coordinator
    if _coordinator is None:
        _coordinator = AgriAdvisorCoordinator()
    return _coordinator


def query_agent(query: str, context: Dict = None) -> Dict:
    """
    Main API function to query the AI agent.
    
    Args:
        query: Natural language question
        context: Optional context dict with current conditions
        
    Returns:
        Dict with answer, reasoning, citations, recommendations
    """
    coordinator = get_coordinator()
    response = coordinator.query(query, context)
    return asdict(response)


# ==================== TEST ====================

if __name__ == "__main__":
    # Test the agent
    print("🤖 Testing AI Advisory Agent...")
    
    # Test crop health query
    result = query_agent(
        "My rice crop is at vegetative stage. Temperature is 35°C and soil moisture is 25%. Is it stressed?",
        {"location": "Palakkad"}
    )
    
    print("\n" + "=" * 60)
    print("QUERY: Rice crop health at 35°C")
    print("=" * 60)
    print(f"\n{result['answer']}")
    print(f"\n🔍 Confidence: {result['confidence']:.1%}")
    print(f"🤖 Agent: {result['agent_type']}")
    
    if result['reasoning_steps']:
        print("\n📝 Reasoning Chain:")
        for step in result['reasoning_steps']:
            print(f"  Step {step['step_number']}: {step['thought']}")
    
    if result['citations']:
        print("\n📚 Citations:")
        for cite in result['citations'][:2]:
            print(f"  - {cite['source']}: {cite['excerpt'][:80]}...")
    
    print("\n✅ Agent test complete!")
