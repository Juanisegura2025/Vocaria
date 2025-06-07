"""
Create realistic property data for Buenos Aires apartment
"""
import asyncio
from src.database import get_db
from src.models import Tour, Property
from sqlalchemy import select
from datetime import datetime

async def create_realistic_demo():
    print("🏠 Creating realistic Buenos Aires apartment data...")
    
    async for db in get_db():
        # Get tour
        result = await db.execute(select(Tour).where(Tour.id == 1))
        tour = result.scalar_one_or_none()
        
        if not tour:
            print("❌ Tour not found")
            return
        
        # Delete existing property
        result = await db.execute(select(Property).where(Property.tour_id == 1))
        existing = result.scalar_one_or_none()
        if existing:
            await db.delete(existing)
            await db.commit()
        
        # Realistic Buenos Aires apartment data
        realistic_rooms = [
            {
                "id": "room_living",
                "label": "Living Room",
                "tags": ["living", "main"],
                "area_floor": 28.5,
                "area_floor_indoor": 28.5,
                "volume": 85.5,
                "height": 3.0,
                "units": "metric"
            },
            {
                "id": "room_kitchen",
                "label": "Kitchen",
                "tags": ["kitchen", "cooking"],
                "area_floor": 15.2,
                "area_floor_indoor": 15.2,
                "volume": 45.6,
                "height": 3.0,
                "units": "metric"
            },
            {
                "id": "room_bedroom",
                "label": "Master Bedroom",
                "tags": ["bedroom", "master"],
                "area_floor": 22.8,
                "area_floor_indoor": 22.8,
                "volume": 68.4,
                "height": 3.0,
                "units": "metric"
            },
            {
                "id": "room_bathroom",
                "label": "Full Bathroom",
                "tags": ["bathroom", "full"],
                "area_floor": 8.7,
                "area_floor_indoor": 8.7,
                "volume": 26.1,
                "height": 3.0,
                "units": "metric"
            },
            {
                "id": "room_balcony",
                "label": "Balcony",
                "tags": ["balcony", "outdoor"],
                "area_floor": 12.3,
                "area_floor_indoor": 0.0,
                "volume": 0.0,
                "height": 0.0,
                "units": "metric"
            },
            {
                "id": "room_laundry",
                "label": "Laundry Area",
                "tags": ["laundry", "utility"],
                "area_floor": 4.5,
                "area_floor_indoor": 4.5,
                "volume": 13.5,
                "height": 3.0,
                "units": "metric"
            }
        ]
        
        floors_data = [
            {
                "label": "Main Floor",
                "area_floor": 92.0,
                "area_floor_indoor": 79.7,
                "area_wall": 145.2,
                "volume": 239.1,
                "units": "metric"
            }
        ]
        
        # Create realistic property
        new_property = Property(
            tour_id=1,
            
            # Manual info
            address="Av. Santa Fe 2847, Palermo, CABA",
            price=420000.0,  # USD
            bedrooms=1,
            bathrooms=1,
            area_m2=79.7,
            property_type="apartment",
            description="Moderno departamento de 1 ambiente en Palermo con balcón. Vista abierta, cocina integrada, baño completo y lavadero independiente. Edificio con amenities.",
            
            # Realistic Matterport-style data
            matterport_name="Modern Palermo Apartment - 1BR with Balcony",
            matterport_description="Stunning 1-bedroom apartment in the heart of Palermo with modern finishes and city views. Features integrated kitchen, full bathroom, and private balcony.",
            matterport_visibility="public",
            
            # Buenos Aires address
            address_line1="Av. Santa Fe 2847, Piso 8, Depto A",
            city="Buenos Aires",
            state="CABA",
            postal_code="C1425BGI",
            country="Argentina",
            
            # Real dimensions
            total_area_floor=92.0,  # Including balcony
            total_area_floor_indoor=79.7,  # Indoor only
            total_volume=239.1,
            dimension_units="metric",
            
            # Structured data
            rooms_data=realistic_rooms,
            floors_data=floors_data,
            
            # Realistic URLs
            share_url="https://my.matterport.com/show/?m=SxQL3iGyoDo",
            embed_url="https://my.matterport.com/show/?m=SxQL3iGyoDo&play=1&qs=1",
            
            # Metadata
            data_source="realistic_demo",
            matterport_import_success=True,
            last_matterport_sync=datetime.now()
        )
        
        db.add(new_property)
        await db.commit()
        
        # Update tour with realistic context
        tour.matterport_data_imported = True
        tour.matterport_last_sync = datetime.now()
        tour.matterport_share_url = new_property.share_url
        tour.room_data = realistic_rooms
        
        # Rich agent context
        agent_context = f"""Propiedad: {new_property.matterport_name}. 
Descripción: {new_property.description}. 
Ubicación: {new_property.address_line1}, Palermo, Buenos Aires. 
Área total: {new_property.total_area_floor_indoor:.1f} m² más {new_property.total_area_floor - new_property.total_area_floor_indoor:.1f} m² de balcón. 
Habitaciones: Living Room (28.5 m²), Kitchen (15.2 m²), Master Bedroom (22.8 m²), Full Bathroom (8.7 m²), Balcony (12.3 m²), Laundry Area (4.5 m²). 
Precio: USD {new_property.price:,.0f}. 
Edificio moderno en Palermo con amenities."""
        
        tour.agent_context = agent_context
        await db.commit()
        
        print("✅ REALISTIC property data created!")
        print(f"🏠 Property: {new_property.matterport_name}")
        print(f"📍 Address: {new_property.address}")
        print(f"📐 Total: {new_property.total_area_floor} m² ({new_property.total_area_floor_indoor} m² indoor)")
        print(f"🏠 Rooms: {len(realistic_rooms)}")
        print(f"💰 Price: USD {new_property.price:,.0f}")
        print(f"🤖 Agent context ready: {len(agent_context)} characters")
        
        break

if __name__ == "__main__":
    asyncio.run(create_realistic_demo())
