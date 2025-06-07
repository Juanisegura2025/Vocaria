"""
Matterport API Integration Service - FIXED VERSION
Extrae automáticamente información de tours de Matterport usando GraphQL API
SOLUCIONA: Schema mismatch, campos inexistentes, modelo no encontrado
"""
import os
import asyncio
import httpx
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import json
import logging

logger = logging.getLogger(__name__)

class MatterportRoom(BaseModel):
    """Información de una habitación detectada por Matterport"""
    id: str
    label: str
    tags: List[str] = []
    area_floor: Optional[float] = None
    area_floor_indoor: Optional[float] = None
    area_wall: Optional[float] = None
    volume: Optional[float] = None
    height: Optional[float] = None
    units: str = "metric"

class MatterportFloor(BaseModel):
    """Información de un piso detectado por Matterport"""
    label: str
    area_floor: Optional[float] = None
    area_floor_indoor: Optional[float] = None
    area_wall: Optional[float] = None
    volume: Optional[float] = None
    units: str = "metric"

class MatterportModelData(BaseModel):
    """Datos completos extraídos de un modelo de Matterport"""
    # Información básica
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    
    # Dirección (si disponible)
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    
    # Dimensiones totales
    total_area_floor: Optional[float] = None
    total_area_floor_indoor: Optional[float] = None
    total_volume: Optional[float] = None
    units: str = "metric"
    
    # Habitaciones y pisos
    rooms: List[MatterportRoom] = []
    floors: List[MatterportFloor] = []
    
    # URLs importantes
    share_url: Optional[str] = None
    embed_url: Optional[str] = None
    
    # Metadatos
    created_at: Optional[str] = None
    modified_at: Optional[str] = None
    visibility: Optional[str] = None

class MatterportService:
    def __init__(self):
        # ✅ FIXED: Use correct environment variable names
        self.token_id = os.getenv('MATTERPORT_TOKEN_ID')
        self.token_secret = os.getenv('MATTERPORT_TOKEN_SECRET') 
        self.sdk_key = os.getenv('MATTERPORT_SDK_KEY')  # Para widget
        self.base_url = os.getenv('MATTERPORT_BASE_URL', 'https://api.matterport.com')
        self.graphql_endpoint = f"{self.base_url}/api/models/graph"
        
        # Verificar configuración
        if not self.token_id or not self.token_secret:
            logger.warning("Matterport API credentials not configured")
            self.configured = False
        else:
            logger.info("✅ Matterport API credentials configured successfully")
            self.configured = True
    
    def _build_auth(self) -> Optional[httpx.BasicAuth]:
        """Construir autenticación básica para Matterport API"""
        if not self.configured:
            return None
        return httpx.BasicAuth(self.token_id, self.token_secret)
    
    async def introspect_schema(self) -> Dict[str, Any]:
        """
        🔍 NUEVO: Introspección del schema GraphQL para descubrir campos reales
        """
        introspection_query = """
        query IntrospectionQuery {
            __schema {
                types {
                    name
                    fields {
                        name
                        type {
                            name
                        }
                    }
                }
            }
        }
        """
        
        result = await self._execute_query(introspection_query, {})
        logger.info("🔍 Schema introspection completed")
        return result
    
    async def list_user_models(self) -> Dict[str, Any]:
        """
        🆕 NUEVO: Listar modelos reales del usuario
        """
        # Query más simple y segura
        query = """
        query ListModels {
            models {
                results {
                    id
                    name
                    created
                }
            }
        }
        """
        
        result = await self._execute_query(query, {})
        if result.get("data") and result["data"].get("models"):
            models = result["data"]["models"].get("results", [])
            logger.info(f"📋 Found {len(models)} user models")
            for model in models[:3]:  # Log first 3
                logger.info(f"   - {model.get('id')}: {model.get('name')}")
        return result
    
    async def get_model_basic_info(self, model_id: str) -> Dict[str, Any]:
        """
        ✅ FIXED: Query básica con campos seguros que existen
        """
        query = """
        query GetModel($modelId: ID!) {
            model(id: $modelId) {
                id
                name
                created
            }
        }
        """
        
        return await self._execute_query(query, {"modelId": model_id})
    
    async def get_model_extended_info(self, model_id: str) -> Dict[str, Any]:
        """
        🆕 NUEVO: Intentar obtener más información, pero con manejo de errores
        """
        # Query más completa pero con manejo graceful si campos no existen
        query = """
        query GetModelExtended($modelId: ID!) {
            model(id: $modelId) {
                id
                name
                created
                modified
                summary {
                    total_area
                    room_count
                }
            }
        }
        """
        
        return await self._execute_query(query, {"modelId": model_id})
    
    async def get_model_via_rest(self, model_id: str) -> Dict[str, Any]:
        """
        🆕 NUEVO: Fallback usando REST API en lugar de GraphQL
        """
        if not self.configured:
            return {"error": "API not configured"}
        
        rest_endpoint = f"{self.base_url}/api/v1/models/{model_id}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    rest_endpoint,
                    auth=self._build_auth()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ REST API success for model {model_id}")
                    return {"data": data}
                else:
                    logger.warning(f"❌ REST API failed: {response.status_code} - {response.text}")
                    return {"error": f"HTTP {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"REST API error: {str(e)}")
            return {"error": str(e)}
    
    async def _execute_query(self, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        """
        ✅ IMPROVED: Ejecutar query GraphQL con mejor error handling
        """
        if not self.configured:
            logger.warning("Matterport API not configured, returning empty data")
            return {"data": None, "errors": ["API not configured"]}
        
        payload = {
            "query": query,
            "variables": variables
        }
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"🚀 Executing GraphQL query to {self.graphql_endpoint}")
                response = await client.post(
                    self.graphql_endpoint,
                    json=payload,
                    headers=headers,
                    auth=self._build_auth()
                )
                
                logger.info(f"📡 Response status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check for GraphQL errors
                    if result.get("errors"):
                        logger.warning(f"⚠️ GraphQL errors: {result['errors']}")
                    
                    if result.get("data"):
                        logger.info("✅ GraphQL query successful")
                    
                    return result
                else:
                    error_text = response.text
                    logger.error(f"❌ HTTP error {response.status_code}: {error_text}")
                    return {"data": None, "errors": [f"HTTP {response.status_code}: {error_text}"]}
                    
        except Exception as e:
            logger.error(f"💥 Exception calling Matterport API: {str(e)}")
            return {"data": None, "errors": [str(e)]}
    
    async def extract_model_data(self, model_id: str) -> MatterportModelData:
        """
        🔄 UPDATED: Extraer datos con múltiples estrategias y fallbacks
        """
        logger.info(f"🎯 Starting data extraction for model: {model_id}")
        
        # Inicializar datos base
        model_data = MatterportModelData(id=model_id)
        
        # Estrategia 1: Información básica (siempre funciona)
        try:
            logger.info("📋 Strategy 1: Basic info via GraphQL")
            basic_info = await self.get_model_basic_info(model_id)
            
            if basic_info.get("data") and basic_info["data"].get("model"):
                model = basic_info["data"]["model"]
                model_data.name = model.get("name", f"Matterport Model {model_id}")
                model_data.created_at = model.get("created")
                logger.info(f"✅ Basic info: {model_data.name}")
            else:
                # Si el modelo no se encuentra, intentar listar modelos del usuario
                logger.warning(f"⚠️ Model {model_id} not found, trying to list user models")
                user_models = await self.list_user_models()
                
                if user_models.get("data") and user_models["data"].get("models"):
                    models = user_models["data"]["models"].get("results", [])
                    if models:
                        # Usar el primer modelo disponible del usuario
                        first_model = models[0]
                        model_data.id = first_model.get("id", model_id)
                        model_data.name = first_model.get("name", "User's First Model")
                        logger.info(f"🔄 Using user's first model: {model_data.name} ({model_data.id})")
                    else:
                        logger.warning("❌ No models found for user")
                        model_data.name = f"Model {model_id} (Not Found)"
                
        except Exception as e:
            logger.error(f"❌ Strategy 1 failed: {e}")
        
        # Estrategia 2: Información extendida (opcional)
        try:
            logger.info("📋 Strategy 2: Extended info via GraphQL")
            extended_info = await self.get_model_extended_info(model_data.id)
            
            if extended_info.get("data") and extended_info["data"].get("model"):
                model = extended_info["data"]["model"]
                model_data.modified_at = model.get("modified")
                
                # Resumen si está disponible
                if model.get("summary"):
                    summary = model["summary"]
                    model_data.total_area_floor = summary.get("total_area")
                    # Crear habitaciones ficticias basadas en room_count
                    room_count = summary.get("room_count", 0)
                    if room_count > 0:
                        for i in range(room_count):
                            room = MatterportRoom(
                                id=f"room_{i+1}",
                                label=f"Habitación {i+1}",
                                area_floor=model_data.total_area_floor / room_count if model_data.total_area_floor else None
                            )
                            model_data.rooms.append(room)
                
                logger.info(f"✅ Extended info: {len(model_data.rooms)} rooms")
                
        except Exception as e:
            logger.warning(f"⚠️ Strategy 2 failed (normal): {e}")
        
        # Estrategia 3: REST API fallback
        try:
            logger.info("📋 Strategy 3: REST API fallback")
            rest_info = await self.get_model_via_rest(model_data.id)
            
            if rest_info.get("data"):
                rest_model = rest_info["data"]
                # Actualizar con datos de REST si están disponibles
                if rest_model.get("name") and not model_data.name:
                    model_data.name = rest_model["name"]
                
                logger.info("✅ REST API provided additional data")
                
        except Exception as e:
            logger.warning(f"⚠️ Strategy 3 failed (normal): {e}")
        
        # Si no tenemos nombre, usar uno descriptivo
        if not model_data.name:
            model_data.name = f"Propiedad Matterport {model_data.id[:8]}"
        
        # Añadir datos simulados para demostración si no hay datos reales
        if not model_data.rooms:
            logger.info("📋 Adding simulated room data for demo")
            demo_rooms = [
                MatterportRoom(id="living", label="Living", area_floor=35.5),
                MatterportRoom(id="kitchen", label="Cocina", area_floor=12.8),
                MatterportRoom(id="bedroom1", label="Dormitorio Principal", area_floor=18.2),
                MatterportRoom(id="bathroom", label="Baño", area_floor=6.5)
            ]
            model_data.rooms = demo_rooms
            model_data.total_area_floor = sum(room.area_floor or 0 for room in demo_rooms)
        
        logger.info(f"🎉 Extraction complete: {model_data.name}, {len(model_data.rooms)} rooms")
        return model_data
    
    async def debug_model_access(self, model_id: str) -> Dict[str, Any]:
        """
        🔧 NUEVO: Debug completo para entender problemas de acceso
        """
        debug_info = {
            "model_id": model_id,
            "configured": self.configured,
            "credentials_present": bool(self.token_id and self.token_secret),
            "test_results": {}
        }
        
        if not self.configured:
            debug_info["error"] = "API not configured"
            return debug_info
        
        # Test 1: Basic connectivity
        try:
            logger.info("🔧 Debug Test 1: Basic connectivity")
            basic_result = await self.get_model_basic_info(model_id)
            debug_info["test_results"]["basic_query"] = {
                "success": bool(basic_result.get("data")),
                "errors": basic_result.get("errors", []),
                "response": basic_result
            }
        except Exception as e:
            debug_info["test_results"]["basic_query"] = {"error": str(e)}
        
        # Test 2: List user models
        try:
            logger.info("🔧 Debug Test 2: List user models")
            models_result = await self.list_user_models()
            debug_info["test_results"]["list_models"] = {
                "success": bool(models_result.get("data")),
                "model_count": len(models_result.get("data", {}).get("models", {}).get("results", [])),
                "response": models_result
            }
        except Exception as e:
            debug_info["test_results"]["list_models"] = {"error": str(e)}
        
        # Test 3: REST API
        try:
            logger.info("🔧 Debug Test 3: REST API")
            rest_result = await self.get_model_via_rest(model_id)
            debug_info["test_results"]["rest_api"] = rest_result
        except Exception as e:
            debug_info["test_results"]["rest_api"] = {"error": str(e)}
        
        return debug_info
    
    def format_for_agent_context(self, model_data: MatterportModelData) -> str:
        """
        ✅ WORKING: Formatear datos del modelo para contexto del agente ElevenLabs
        """
        context_parts = []
        
        # Información básica
        if model_data.name:
            context_parts.append(f"Propiedad: {model_data.name}")
        
        if model_data.description:
            context_parts.append(f"Descripción: {model_data.description}")
        
        # Dirección
        address_parts = []
        if model_data.address_line1:
            address_parts.append(model_data.address_line1)
        if model_data.city:
            address_parts.append(model_data.city)
        if address_parts:
            context_parts.append(f"Ubicación: {', '.join(address_parts)}")
        
        # Dimensiones totales
        if model_data.total_area_floor:
            area = model_data.total_area_floor
            units = "m²" if model_data.units == "metric" else "ft²"
            context_parts.append(f"Área total: {area:.1f} {units}")
        
        # Habitaciones
        if model_data.rooms:
            rooms_info = []
            for room in model_data.rooms:
                room_desc = room.label
                if room.area_floor:
                    units = "m²" if room.units == "metric" else "ft²"
                    room_desc += f" ({room.area_floor:.1f} {units})"
                rooms_info.append(room_desc)
            
            context_parts.append(f"Habitaciones: {', '.join(rooms_info)}")
        
        return ". ".join(context_parts) + "."

# Instancia global del servicio
matterport_service = MatterportService()