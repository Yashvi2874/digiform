from OCC.Core.BRepPrimAPI import (BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeBox, 
                                   BRepPrimAPI_MakeTorus, BRepPrimAPI_MakeSphere)
from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
from OCC.Core.gp import gp_Pnt, gp_Ax2, gp_Dir, gp_Vec
from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_Transform, BRepBuilderAPI_MakeEdge
from OCC.Core.STEPControl import STEPControl_Writer, STEPControl_AsIs
from OCC.Core.IFSelect import IFSelect_RetDone
from OCC.Core.TopoDS import TopoDS_Shape
import math
import json
import sys

def generate_gear(params):
    """Generate a gear using OpenCascade"""
    radius = params.get('radius', 25)
    thickness = params.get('thickness', 10)
    teeth = params.get('teeth', 20)
    
    # Create base cylinder
    base = BRepPrimAPI_MakeCylinder(radius, thickness).Shape()
    
    # Create center hole (20% of radius)
    hole_radius = radius * 0.2
    hole = BRepPrimAPI_MakeCylinder(hole_radius, thickness).Shape()
    
    # Subtract hole from base
    gear = BRepAlgoAPI_Cut(base, hole).Shape()
    
    return gear

def generate_shaft(params):
    """Generate a shaft"""
    radius = params.get('radius', 12.5)
    length = params.get('length', 100)
    
    shaft = BRepPrimAPI_MakeCylinder(radius, length).Shape()
    return shaft

def generate_bearing(params):
    """Generate a bearing (torus shape)"""
    outer_radius = params.get('outerRadius', 30)
    inner_radius = params.get('innerRadius', 15)
    
    # Create torus
    axis = gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))
    bearing = BRepPrimAPI_MakeTorus(axis, outer_radius, inner_radius).Shape()
    
    return bearing

def generate_bracket(params):
    """Generate a bracket/plate"""
    width = params.get('width', 50)
    height = params.get('height', 50)
    depth = params.get('depth', 10)
    
    bracket = BRepPrimAPI_MakeBox(width, height, depth).Shape()
    return bracket

def generate_bolt(params):
    """Generate a bolt"""
    radius = params.get('radius', 4)
    length = params.get('length', 30)
    head_radius = params.get('headRadius', 6)
    head_height = params.get('headHeight', 3)
    
    # Create shaft
    shaft = BRepPrimAPI_MakeCylinder(radius, length).Shape()
    
    # Create head
    head = BRepPrimAPI_MakeCylinder(head_radius, head_height).Shape()
    
    # Fuse head and shaft
    bolt = BRepAlgoAPI_Fuse(head, shaft).Shape()
    
    return bolt

def generate_component(design_data):
    """Main function to generate component based on type"""
    component_type = design_data.get('type', 'bracket').lower()
    params = design_data.get('parameters', {})
    
    generators = {
        'gear': generate_gear,
        'shaft': generate_shaft,
        'bearing': generate_bearing,
        'bracket': generate_bracket,
        'plate': generate_bracket,
        'bolt': generate_bolt
    }
    
    generator = generators.get(component_type, generate_bracket)
    shape = generator(params)
    
    return shape

def export_to_step(shape, filename):
    """Export shape to STEP file"""
    step_writer = STEPControl_Writer()
    step_writer.Transfer(shape, STEPControl_AsIs)
    status = step_writer.Write(filename)
    
    return status == IFSelect_RetDone

def calculate_properties(shape, material='Steel'):
    """Calculate physical properties of the shape"""
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.BRepGProp import brepgprop_VolumeProperties
    
    props = GProp_GProps()
    brepgprop_VolumeProperties(shape, props)
    
    volume = props.Mass()  # in mm³
    
    # Material densities (kg/m³)
    densities = {
        'Steel': 7850,
        'Aluminum': 2700,
        'Titanium': 4500,
        'Brass': 8500,
        'Copper': 8960
    }
    
    density = densities.get(material, 7850)
    mass = volume * density / 1e9  # Convert to kg
    
    return {
        'volume': volume,
        'mass': mass,
        'material': material
    }

if __name__ == '__main__':
    # Read design data from stdin
    design_json = sys.stdin.read()
    design_data = json.loads(design_json)
    
    # Generate component
    shape = generate_component(design_data)
    
    # Calculate properties
    properties = calculate_properties(shape, design_data.get('material', 'Steel'))
    
    # Export to STEP file
    output_file = f"output/{design_data.get('type', 'component')}.step"
    export_to_step(shape, output_file)
    
    # Return results
    result = {
        'success': True,
        'properties': properties,
        'step_file': output_file
    }
    
    print(json.dumps(result))
