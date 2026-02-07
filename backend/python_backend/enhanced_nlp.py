"""
Enhanced NLP Parser for DigiForm CAD Engine
Extracts complex CAD features, dimensions, and constraints from natural language
"""
import re
from typing import Dict, List, Tuple, Optional, Any
import math

class EnhancedNLPParser:
    """Advanced NLP parser for CAD feature extraction"""
    
    def __init__(self):
        # Enhanced pattern definitions
        self.dimension_patterns = {
            'mm': re.compile(r'(\d+\.?\d*)\s*mm', re.IGNORECASE),
            'cm': re.compile(r'(\d+\.?\d*)\s*cm', re.IGNORECASE),
            'inch': re.compile(r'(\d+\.?\d*)\s*(?:inch|in|"|\'\')', re.IGNORECASE),
            'diameter': re.compile(r'(?:diameter|dia\.?|d)\s*(?:of\s*)?(\d+\.?\d*)\s*(?:mm|cm|inch)', re.IGNORECASE),
            'length': re.compile(r'(?:length|long|l)\s*(?:of\s*)?(\d+\.?\d*)\s*(?:mm|cm|inch)', re.IGNORECASE),
            'width': re.compile(r'(?:width|w)\s*(?:of\s*)?(\d+\.?\d*)\s*(?:mm|cm|inch)', re.IGNORECASE),
            'height': re.compile(r'(?:height|h|thick|thickness|t)\s*(?:of\s*)?(\d+\.?\d*)\s*(?:mm|cm|inch)', re.IGNORECASE),
        }
        
        self.feature_patterns = {
            'hole': re.compile(r'\b(hole|bore|drill)\b', re.IGNORECASE),
            'fillet': re.compile(r'\b(fillet|round)\b', re.IGNORECASE),
            'chamfer': re.compile(r'\b(chamfer|bevel)\b', re.IGNORECASE),
            'pocket': re.compile(r'\b(pocket|cavity|recess)\b', re.IGNORECASE),
            'slot': re.compile(r'\b(slot|groove)\b', re.IGNORECASE),
            'rib': re.compile(r'\b(rib|web|spoke)\b', re.IGNORECASE),
        }
        
        self.pattern_patterns = {
            'circular': re.compile(r'\b(circular|around|circular pattern)\b', re.IGNORECASE),
            'linear': re.compile(r'\b(linear|in a line|row of)\b', re.IGNORECASE),
            'mirror': re.compile(r'\b(mirror|symmetric|symmetrical)\b', re.IGNORECASE),
        }
        
        self.constraint_patterns = {
            'centered': re.compile(r'\b(center|centered|middle|central)\b', re.IGNORECASE),
            'offset': re.compile(r'\b(offset|from edge|from center|distance)\b', re.IGNORECASE),
            'aligned': re.compile(r'\b(aligned|parallel|perpendicular)\b', re.IGNORECASE),
        }
    
    def parse_description(self, description: str) -> Dict[str, Any]:
        """Parse natural language description into CAD features"""
        result = {
            'component_type': self._detect_component_type(description),
            'base_features': [],
            'modifiers': [],
            'dimensions': self._extract_dimensions(description),
            'features': self._extract_features(description),
            'patterns': self._extract_patterns(description),
            'constraints': self._extract_constraints(description),
            'material': self._extract_material(description),
            'parameters': {}
        }
        
        # Build parameters based on extracted information
        result['parameters'] = self._build_parameters(result)
        
        return result
    
    def _detect_component_type(self, text: str) -> str:
        """Detect the main component type"""
        text_lower = text.lower()
        
        if 'gear' in text_lower:
            return 'gear'
        elif 'shaft' in text_lower or 'axle' in text_lower:
            return 'shaft'
        elif 'bearing' in text_lower:
            return 'bearing'
        elif 'bracket' in text_lower or 'mount' in text_lower:
            return 'bracket'
        elif 'plate' in text_lower:
            return 'plate'
        elif 'bolt' in text_lower or 'screw' in text_lower:
            return 'bolt'
        elif 'housing' in text_lower or 'enclosure' in text_lower:
            return 'housing'
        else:
            return 'custom'
    
    def _extract_dimensions(self, text: str) -> Dict[str, float]:
        """Extract all dimensions from text"""
        dimensions = {}
        
        # Extract basic dimensions
        for dim_type, pattern in self.dimension_patterns.items():
            matches = pattern.findall(text)
            if matches:
                if dim_type == 'mm':
                    dimensions[dim_type] = [float(m) for m in matches]
                elif dim_type == 'cm':
                    dimensions[dim_type] = [float(m) * 10 for m in matches]  # Convert to mm
                elif dim_type == 'inch':
                    dimensions[dim_type] = [float(m) * 25.4 for m in matches]  # Convert to mm
                else:
                    dimensions[dim_type] = float(matches[0])
        
        # Extract dimension patterns (WxHxD)
        dim_pattern = re.compile(r'(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(?:x\s*(\d+\.?\d*))?\s*(?:mm|cm|inch)', re.IGNORECASE)
        dim_match = dim_pattern.search(text)
        if dim_match:
            dimensions['width'] = float(dim_match.group(1))
            dimensions['height'] = float(dim_match.group(2))
            if dim_match.group(3):
                dimensions['depth'] = float(dim_match.group(3))
        
        # Extract teeth count for gears
        teeth_match = re.search(r'(\d+)\s*(?:teeth|tooth)', text, re.IGNORECASE)
        if teeth_match:
            dimensions['teeth'] = int(teeth_match.group(1))
        
        # Extract module for gears
        module_match = re.search(r'module\s*(\d+\.?\d*)', text, re.IGNORECASE)
        if module_match:
            dimensions['module'] = float(module_match.group(1))
        
        return dimensions
    
    def _extract_features(self, text: str) -> List[Dict[str, Any]]:
        """Extract CAD features (holes, fillets, chamfers, etc.)"""
        features = []
        text_lower = text.lower()
        
        # Extract holes
        hole_matches = list(self.feature_patterns['hole'].finditer(text_lower))
        if hole_matches:
            hole_sizes = self._extract_hole_sizes(text)
            hole_positions = self._extract_hole_positions(text)
            
            for i, match in enumerate(hole_matches):
                features.append({
                    'type': 'hole',
                    'diameter': hole_sizes[i] if i < len(hole_sizes) else 10,
                    'position': hole_positions[i] if i < len(hole_positions) else (0, 0),
                    'count': 1
                })
        
        # Extract fillets
        fillet_matches = list(self.feature_patterns['fillet'].finditer(text_lower))
        if fillet_matches:
            fillet_radii = self._extract_radii(text, 'fillet')
            for radius in fillet_radii:
                features.append({
                    'type': 'fillet',
                    'radius': radius,
                    'edges': 'all'  # Default to all edges
                })
        
        # Extract chamfers
        chamfer_matches = list(self.feature_patterns['chamfer'].finditer(text_lower))
        if chamfer_matches:
            chamfer_lengths = self._extract_chamfer_lengths(text)
            for length in chamfer_lengths:
                features.append({
                    'type': 'chamfer',
                    'length': length,
                    'edges': 'all'
                })
        
        return features
    
    def _extract_patterns(self, text: str) -> List[Dict[str, Any]]:
        """Extract pattern information (circular, linear, mirror)"""
        patterns = []
        text_lower = text.lower()
        
        # Circular patterns
        if self.pattern_patterns['circular'].search(text_lower):
            count = self._extract_count(text, 'circular')
            radius = self._extract_radius_from_context(text, 'circular')
            patterns.append({
                'type': 'circular',
                'count': count,
                'radius': radius
            })
        
        # Linear patterns
        if self.pattern_patterns['linear'].search(text_lower):
            count = self._extract_count(text, 'linear')
            spacing = self._extract_spacing(text)
            direction = self._extract_direction(text)
            patterns.append({
                'type': 'linear',
                'count': count,
                'spacing': spacing,
                'direction': direction
            })
        
        return patterns
    
    def _extract_constraints(self, text: str) -> List[Dict[str, Any]]:
        """Extract geometric constraints"""
        constraints = []
        text_lower = text.lower()
        
        # Centered constraints
        if self.constraint_patterns['centered'].search(text_lower):
            constraints.append({
                'type': 'centered',
                'reference': 'origin'  # Default to origin
            })
        
        # Offset constraints
        offset_matches = list(self.constraint_patterns['offset'].finditer(text_lower))
        if offset_matches:
            distances = self._extract_distances(text)
            for distance in distances:
                constraints.append({
                    'type': 'offset',
                    'distance': distance,
                    'from': 'edge'  # Default
                })
        
        return constraints
    
    def _extract_material(self, text: str) -> str:
        """Extract material information"""
        text_lower = text.lower()
        
        if 'steel' in text_lower:
            return 'Steel'
        elif 'aluminum' in text_lower or 'aluminium' in text_lower:
            return 'Aluminum'
        elif 'titanium' in text_lower:
            return 'Titanium'
        elif 'brass' in text_lower:
            return 'Brass'
        elif 'copper' in text_lower:
            return 'Copper'
        elif 'plastic' in text_lower:
            return 'Plastic'
        else:
            return 'Steel'  # Default
    
    def _extract_hole_sizes(self, text: str) -> List[float]:
        """Extract hole diameters"""
        sizes = []
        # Look for patterns like "10mm hole", "hole 10mm diameter", etc.
        patterns = [
            r'(\d+\.?\d*)\s*mm\s*hole',
            r'hole\s*(?:of\s*)?(\d+\.?\d*)\s*mm',
            r'(\d+\.?\d*)\s*mm\s*diameter\s*hole'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            sizes.extend([float(m) for m in matches])
        
        return sizes if sizes else [10.0]  # Default hole size
    
    def _extract_hole_positions(self, text: str) -> List[Tuple[float, float]]:
        """Extract hole positions"""
        positions = []
        # Look for coordinate patterns
        coord_pattern = r'\((\d+\.?\d*)\s*,\s*(\d+\.?\d*)\)'
        matches = re.findall(coord_pattern, text)
        
        for match in matches:
            positions.append((float(match[0]), float(match[1])))
        
        return positions if positions else [(0, 0)]  # Default center position
    
    def _extract_radii(self, text: str, feature_type: str) -> List[float]:
        """Extract radii for fillets/chamfers"""
        radii = []
        patterns = [
            rf'{feature_type}\s*radius\s*(\d+\.?\d*)\s*mm',
            rf'(\d+\.?\d*)\s*mm\s*{feature_type}\s*radius'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            radii.extend([float(m) for m in matches])
        
        return radii if radii else [2.0]  # Default radius
    
    def _extract_chamfer_lengths(self, text: str) -> List[float]:
        """Extract chamfer lengths"""
        lengths = []
        patterns = [
            r'chamfer\s*length\s*(\d+\.?\d*)\s*mm',
            r'(\d+\.?\d*)\s*mm\s*chamfer'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            lengths.extend([float(m) for m in matches])
        
        return lengths if lengths else [1.0]  # Default chamfer length
    
    def _extract_count(self, text: str, pattern_type: str) -> int:
        """Extract count for patterns"""
        count_patterns = [
            rf'(\d+)\s*{pattern_type}',
            rf'{pattern_type}\s*of\s*(\d+)',
            rf'(\d+)\s*(?:holes?|items?|elements?)\s*in\s*{pattern_type}'
        ]
        
        for pattern in count_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
        
        return 4  # Default count
    
    def _extract_radius_from_context(self, text: str, pattern_type: str) -> float:
        """Extract radius from context for circular patterns"""
        radius_patterns = [
            rf'{pattern_type}\s*radius\s*(\d+\.?\d*)\s*mm',
            rf'(\d+\.?\d*)\s*mm\s*{pattern_type}\s*radius'
        ]
        
        for pattern in radius_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        
        return 30.0  # Default radius
    
    def _extract_spacing(self, text: str) -> float:
        """Extract spacing for linear patterns"""
        spacing_patterns = [
            r'spaced\s*(\d+\.?\d*)\s*mm\s*apart',
            r'(\d+\.?\d*)\s*mm\s*spacing',
            r'spacing\s*of\s*(\d+\.?\d*)\s*mm'
        ]
        
        for pattern in spacing_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        
        return 20.0  # Default spacing
    
    def _extract_direction(self, text: str) -> str:
        """Extract direction for linear patterns"""
        if 'horizontal' in text.lower() or 'x direction' in text.lower():
            return 'X'
        elif 'vertical' in text.lower() or 'y direction' in text.lower():
            return 'Y'
        else:
            return 'X'  # Default direction
    
    def _extract_distances(self, text: str) -> List[float]:
        """Extract distances for offset constraints"""
        distances = []
        patterns = [
            r'(\d+\.?\d*)\s*mm\s*from',
            r'offset\s*(\d+\.?\d*)\s*mm',
            r'distance\s*of\s*(\d+\.?\d*)\s*mm'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            distances.extend([float(m) for m in matches])
        
        return distances if distances else [5.0]  # Default distance
    
    def _build_parameters(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build parameters dictionary from parsed data"""
        params = {}
        dims = parsed_data['dimensions']
        features = parsed_data['features']
        
        # Component-specific parameters
        component_type = parsed_data['component_type']
        
        if component_type == 'gear':
            params['teeth'] = dims.get('teeth', 20)
            params['module'] = dims.get('module', 2.0)
            params['thickness'] = dims.get('thickness', dims.get('height', 10))
            # Calculate pitch diameter
            params['pitch_diameter'] = params['module'] * params['teeth']
            
        elif component_type == 'shaft':
            params['diameter'] = dims.get('diameter', dims.get('width', 20))
            params['length'] = dims.get('length', 100)
            
        elif component_type == 'bracket':
            params['width'] = dims.get('width', 50)
            params['height'] = dims.get('height', 30)
            params['thickness'] = dims.get('thickness', dims.get('depth', 10))
            
        # Add feature parameters
        for feature in features:
            if feature['type'] == 'hole':
                params.setdefault('holes', []).append({
                    'diameter': feature['diameter'],
                    'position': feature['position']
                })
            elif feature['type'] == 'fillet':
                params['fillet_radius'] = feature['radius']
            elif feature['type'] == 'chamfer':
                params['chamfer_length'] = feature['length']
        
        return params

# Example usage
if __name__ == "__main__":
    parser = EnhancedNLPParser()
    
    # Test with complex description
    description = """
    Create a steel bracket 100mm x 50mm x 10mm thick with 4 mounting holes 
    8mm diameter arranged in a circular pattern 30mm radius from center. 
    Add 2mm fillets to all edges and chamfer the corners with 1mm length.
    """
    
    result = parser.parse_description(description)
    print(json.dumps(result, indent=2))