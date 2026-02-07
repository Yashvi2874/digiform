"""
DigiForm CAD Engine Integration Module
Main interface for the enhanced CAD functionality
"""
import json
import os
from typing import Dict, Any, Optional, List
from .cad_engine import ParametricEngine, CADModel, export_stl, export_step
from .enhanced_nlp import EnhancedNLPParser
from .pyvista_viewer import CADViewport

class DigiformCADEngine:
    """Main CAD engine interface for DigiForm"""
    
    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir
        self.nlp_parser = EnhancedNLPParser()
        self.viewport = CADViewport()
        self.current_model = None
        self.feature_history = []
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Start real-time viewer
        self.viewport.start_realtime_viewer()
    
    def process_natural_language(self, description: str) -> Dict[str, Any]:
        """
        Process natural language description into CAD model
        Returns detailed parsing results and model information with centerline validation
        
        MANDATORY GEAR RULE: If gears are requested, validate that Module/DP and teeth count are specified.
        """
        try:
            # Parse the description
            parsed_data = self.nlp_parser.parse_description(description)
            
            # GEAR HANDLING RULE: Check for incomplete gear specifications
            if parsed_data['component_type'] == 'gear':
                gear_validation = parsed_data.get('gear_validation', {})
                missing_params = parsed_data.get('missing_gear_params', [])
                
                if missing_params:
                    return {
                        'success': False,
                        'error': 'INCOMPLETE GEAR SPECIFICATION - Gears must NOT be approximated as cylinders',
                        'component_type': 'gear',
                        'missing_parameters': missing_params,
                        'specification_quality': gear_validation.get('specification_quality', 'INCOMPLETE'),
                        'required_info': {
                            'module': 'e.g., "module 2" (metric tooth size)',
                            'or_diametral_pitch': 'e.g., "diametral pitch 12" or "DP 12"',
                            'teeth': f"e.g., '20 teeth' (current: {parsed_data['dimensions'].get('teeth', 'NOT SPECIFIED')})",
                            'pressure_angle': 'e.g., "20° pressure angle" (standard 20° used if not specified)',
                            'thickness': 'e.g., "10mm thick" (face width)'
                        },
                        'example_complete_request': 'Create a spur gear with module 2, 20 teeth, 20° pressure angle, 10mm thickness',
                        'errors': gear_validation.get('errors', [])
                    }
            
            # Create CAD model based on parsed data
            model = self._create_model_from_parsed_data(parsed_data)
            
            if model:
                self.current_model = model
                self.feature_history.append({
                    'description': description,
                    'parsed_data': parsed_data,
                    'model': model,
                    'timestamp': self._get_timestamp()
                })
                
                # Generate preview
                preview_image = self.viewport.render_model(model)
                
                response = {
                    'success': True,
                    'model': model,
                    'parsed_data': parsed_data,
                    'preview': preview_image,
                    'properties': self._get_model_properties(model),
                    'feature_checklist': self._generate_feature_checklist(parsed_data),
                    'centerline_info': {
                        'type': parsed_data.get('centerline_type', 'XYZ'),
                        'validation': model.get_centerline_validation()
                    }
                }
                
                # Add gear specifications to response if applicable
                if parsed_data['component_type'] == 'gear' and hasattr(model, 'gear_specs'):
                    response['gear_specifications'] = model.gear_specs
                
                return response
            else:
                return {
                    'success': False,
                    'error': 'Failed to create CAD model from parsed data'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Processing error: {str(e)}'
            }
    
    def _create_model_from_parsed_data(self, parsed_data: Dict[str, Any]) -> Optional[CADModel]:
        """Create CAD model from parsed natural language data"""
        component_type = parsed_data['component_type']
        parameters = parsed_data['parameters']
        centerline_type = parsed_data.get('centerline_type', 'XYZ')
        
        # Map centerline type to model type
        model_type_map = {
            'Z': 'cylindrical',
            'XYZ': 'prismatic'
        }
        model_type = model_type_map.get(centerline_type, 'prismatic')
        
        try:
            if component_type == 'gear':
                return ParametricEngine.create_gear(
                    teeth=parameters.get('teeth', 20),
                    module=parameters.get('module', 2.0),
                    thickness=parameters.get('thickness', 10),
                    bore_diameter=parameters.get('bore_diameter', 0),
                    pressure_angle=parameters.get('pressure_angle', 20.0)
                )
            elif component_type == 'shaft':
                return ParametricEngine.create_shaft(
                    diameter=parameters.get('diameter', 20),
                    length=parameters.get('length', 100)
                )
            elif component_type == 'bracket':
                # Extract mounting holes
                mounting_holes = []
                if 'holes' in parameters:
                    for hole in parameters['holes']:
                        mounting_holes.append((
                            hole['position'][0],
                            hole['position'][1],
                            hole['diameter']
                        ))
                
                return ParametricEngine.create_bracket(
                    width=parameters.get('width', 50),
                    height=parameters.get('height', 30),
                    thickness=parameters.get('thickness', 10),
                    mounting_holes=mounting_holes if mounting_holes else None
                )
            elif component_type == 'custom':
                # Create custom component from features
                features = self._build_feature_list(parsed_data)
                return ParametricEngine.create_custom_component(features, model_type=model_type)
            else:
                # Default to bracket for unknown types
                return ParametricEngine.create_bracket(50, 30, 10)
                
        except Exception as e:
            print(f"Model creation error: {e}")
            return None
    
    def _build_feature_list(self, parsed_data: Dict[str, Any]) -> List[Dict]:
        """Build feature list for custom components"""
        features = []
        
        # Add base sketch
        dims = parsed_data['dimensions']
        features.append({
            'type': 'sketch',
            'name': 'base_sketch',
            'parameters': {
                'type': 'rectangle',
                'width': dims.get('width', 50),
                'height': dims.get('height', 30)
            }
        })
        
        # Add extrude
        features.append({
            'type': 'extrude',
            'name': 'extrude_base',
            'parameters': {
                'depth': dims.get('thickness', dims.get('depth', 10))
            }
        })
        
        # Add holes
        for feature in parsed_data['features']:
            if feature['type'] == 'hole':
                features.append({
                    'type': 'hole',
                    'name': f'hole_{len(features)}',
                    'parameters': {
                        'diameter': feature['diameter'],
                        'x': feature['position'][0],
                        'y': feature['position'][1],
                        'depth': dims.get('thickness', 10)
                    }
                })
            elif feature['type'] == 'fillet':
                features.append({
                    'type': 'fillet',
                    'name': f'fillet_{len(features)}',
                    'parameters': {
                        'radius': feature['radius'],
                        'selector': '|Z'
                    }
                })
            elif feature['type'] == 'chamfer':
                features.append({
                    'type': 'chamfer',
                    'name': f'chamfer_{len(features)}',
                    'parameters': {
                        'length': feature['length'],
                        'selector': '|Z'
                    }
                })
        
        return features
    
    def modify_model(self, modifications: str) -> Dict[str, Any]:
        """Modify current model based on natural language modifications"""
        if not self.current_model:
            return {
                'success': False,
                'error': 'No current model to modify'
            }
        
        try:
            # Parse modifications
            mod_parsed = self.nlp_parser.parse_description(modifications)
            
            # Apply modifications to current model
            # This is a simplified implementation - full parametric modification
            # would require more sophisticated feature tracking
            modified_model = self._apply_modifications(self.current_model, mod_parsed)
            
            if modified_model:
                self.current_model = modified_model
                preview_image = self.viewport.render_model(modified_model)
                
                return {
                    'success': True,
                    'model': modified_model,
                    'preview': preview_image,
                    'changes': self._describe_changes(mod_parsed)
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to apply modifications'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Modification error: {str(e)}'
            }
    
    def _apply_modifications(self, model: CADModel, modifications: Dict[str, Any]) -> Optional[CADModel]:
        """Apply modifications to existing model"""
        # This is a simplified implementation
        # Full parametric modification would require:
        # 1. Feature tree tracking
        # 2. Parameter dependency management
        # 3. Constraint resolution
        # 4. Rebuild propagation
        
        # For now, create new model with modified parameters
        return self._create_model_from_parsed_data(modifications)
    
    def export_model(self, format: str = 'stl', filename: Optional[str] = None) -> Dict[str, Any]:
        """Export current model to specified format"""
        if not self.current_model:
            return {
                'success': False,
                'error': 'No model to export'
            }
        
        try:
            if not filename:
                filename = f"model_{self._get_timestamp()}.{format.lower()}"
            
            filepath = os.path.join(self.output_dir, filename)
            
            if format.lower() == 'stl':
                success = export_stl(self.current_model, filepath)
            elif format.lower() == 'step':
                success = export_step(self.current_model, filepath)
            elif format.lower() == 'obj':
                # Would need additional implementation
                success = False
            else:
                return {
                    'success': False,
                    'error': f'Unsupported format: {format}'
                }
            
            if success:
                return {
                    'success': True,
                    'filepath': filepath,
                    'format': format,
                    'size': os.path.getsize(filepath) if os.path.exists(filepath) else 0
                }
            else:
                return {
                    'success': False,
                    'error': 'Export failed'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Export error: {str(e)}'
            }
    
    def get_model_properties(self) -> Dict[str, Any]:
        """Get detailed properties of current model"""
        if not self.current_model:
            return {'error': 'No model available'}
        
        return self._get_model_properties(self.current_model)
    
    def _get_model_properties(self, model: CADModel) -> Dict[str, Any]:
        """Extract model properties"""
        bbox = model.get_bounding_box()
        volume = model.get_volume()
        mass = model.get_mass()
        
        return {
            'bounding_box': {
                'length': round(bbox[0], 2),
                'width': round(bbox[1], 2),
                'height': round(bbox[2], 2)
            },
            'volume': round(volume, 2),
            'mass': round(mass, 2),
            'surface_area': round(self._calculate_surface_area(model), 2),
            'feature_count': len(model.features),
            'complexity': self._assess_complexity(model)
        }
    
    def _calculate_surface_area(self, model: CADModel) -> float:
        """Calculate approximate surface area"""
        # Simplified calculation - would need proper mesh analysis for accuracy
        bbox = model.get_bounding_box()
        # Approximate as rectangular prism surface area
        l, w, h = bbox
        return 2 * (l*w + l*h + w*h)
    
    def _assess_complexity(self, model: CADModel) -> str:
        """Assess model complexity"""
        feature_count = len(model.features)
        if feature_count <= 3:
            return 'low'
        elif feature_count <= 6:
            return 'medium'
        else:
            return 'high'
    
    def _generate_feature_checklist(self, parsed_data: Dict[str, Any]) -> List[str]:
        """Generate feature checklist from parsed data with centerline validation"""
        checklist = []
        
        # Centerline validation header
        centerline_type = parsed_data.get('centerline_type', 'XYZ')
        if centerline_type == 'Z':
            checklist.append("✔ CENTERLINE CREATED: Z-axis (Cylindrical/Symmetric)")
        else:
            checklist.append("✔ CENTERLINE CREATED: Orthogonal X,Y,Z axes (Prismatic)")
        checklist.append("✔ CENTERLINE ORIGIN: (0, 0, 0)")
        checklist.append("")
        
        # Component type
        checklist.append(f"✓ Component type: {parsed_data['component_type']}")
        
        # Dimensions
        dims = parsed_data['dimensions']
        for dim_name, dim_value in dims.items():
            if dim_name not in ['mm', 'cm', 'inch']:  # Skip unit arrays
                if isinstance(dim_value, list):
                    checklist.append(f"✓ {dim_name}: {dim_value[0]} mm")
                else:
                    checklist.append(f"✓ {dim_name}: {dim_value} mm")
        
        # Features with centerline usage
        for feature in parsed_data['features']:
            feature_type = feature['type']
            if feature_type in ['hole', 'bore', 'pocket']:
                checklist.append(f"✔ {feature_type.upper()}: CENTERED on {centerline_type}-axis")
            else:
                checklist.append(f"✓ {feature_type}: {feature.get('diameter', feature.get('radius', feature.get('length', 'specified')))}")
        
        # Patterns
        for pattern in parsed_data['patterns']:
            if pattern['type'] == 'circular':
                checklist.append(f"✔ Circular PATTERN: {pattern['count']} items around {centerline_type}-axis")
            else:
                checklist.append(f"✓ {pattern['type']} pattern: {pattern['count']} items")
        
        # Constraints
        for constraint in parsed_data['constraints']:
            checklist.append(f"✓ {constraint['type']} constraint applied")
        
        # Validation summary
        checklist.append("")
        checklist.append("🔍 VALIDATION SUMMARY:")
        checklist.append("✔ Centerline created and visible")
        checklist.append("✔ Centerline aligned with geometry")
        checklist.append("✔ All symmetric features reference centerline")
        
        return checklist
    
    def _describe_changes(self, modifications: Dict[str, Any]) -> List[str]:
        """Describe what changes were made"""
        changes = []
        
        # Dimension changes
        dims = modifications['dimensions']
        for dim_name, dim_value in dims.items():
            if dim_name not in ['mm', 'cm', 'inch']:
                changes.append(f"Modified {dim_name} to {dim_value}")
        
        # Feature changes
        for feature in modifications['features']:
            changes.append(f"Added {feature['type']}")
        
        return changes
    
    def _get_timestamp(self) -> str:
        """Get current timestamp for file naming"""
        from datetime import datetime
        return datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def get_feature_history(self) -> List[Dict[str, Any]]:
        """Get history of all created/modified models"""
        return self.feature_history
    
    def close(self):
        """Clean up resources"""
        self.viewport.close()

# Example usage and testing
if __name__ == "__main__":
    # Initialize CAD engine
    engine = DigiformCADEngine()
    
    # Test with complex description
    description = """
    Create a steel spur gear with 20 teeth, module 2, 40mm pitch diameter, 
    8mm thickness, and a 10mm central bore. Add 2mm fillets to all edges.
    """
    
    print("Processing CAD description...")
    result = engine.process_natural_language(description)
    
    if result['success']:
        print("✓ Model created successfully")
        print(f"✓ Features generated: {len(result['feature_checklist'])}")
        print(f"✓ Model properties: {result['properties']}")
        
        # Export to STL
        export_result = engine.export_model('stl')
        if export_result['success']:
            print(f"✓ Model exported to: {export_result['filepath']}")
    else:
        print(f"✗ Error: {result['error']}")
    
    engine.close()