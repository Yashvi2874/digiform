"""
Test script for DigiForm CAD Engine
Verifies all components are working correctly
"""
import sys
import os
import json

# Add python_backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_backend'))

def test_cad_engine():
    """Test the core CAD engine functionality"""
    print("🧪 Testing CAD Engine...")
    
    try:
        from cad_engine import ParametricEngine, CADModel
        from enhanced_nlp import EnhancedNLPParser
        from digiform_cad import DigiformCADEngine
        
        # Test 1: Basic gear creation
        print("  ✓ Testing gear creation...")
        gear = ParametricEngine.create_gear(20, 2, 10, 8)
        assert gear is not None, "Gear creation failed"
        assert gear.get_volume() > 0, "Gear has no volume"
        print(f"    Gear volume: {gear.get_volume():.2f} mm³")
        
        # Test 2: Shaft creation
        print("  ✓ Testing shaft creation...")
        shaft = ParametricEngine.create_shaft(20, 100)
        assert shaft is not None, "Shaft creation failed"
        print(f"    Shaft volume: {shaft.get_volume():.2f} mm³")
        
        # Test 3: Enhanced NLP parsing
        print("  ✓ Testing NLP parser...")
        parser = EnhancedNLPParser()
        description = "Create a steel bracket 100mm x 50mm x 10mm with 4 mounting holes 8mm diameter"
        parsed = parser.parse_description(description)
        assert parsed['component_type'] == 'bracket', "Component type detection failed"
        assert 'width' in parsed['dimensions'], "Dimension extraction failed"
        print(f"    Parsed component: {parsed['component_type']}")
        print(f"    Dimensions: {parsed['dimensions']}")
        
        # Test 4: Full CAD engine integration
        print("  ✓ Testing full CAD engine...")
        engine = DigiformCADEngine("test_output")
        result = engine.process_natural_language(
            "Create a steel gear with 20 teeth, module 2, 8mm thickness"
        )
        assert result['success'], f"CAD engine failed: {result.get('error', 'Unknown error')}"
        assert 'preview' in result, "Preview generation failed"
        assert 'properties' in result, "Property extraction failed"
        print(f"    Model properties: {result['properties']}")
        print(f"    Features: {len(result['feature_checklist'])} items")
        
        # Test 5: Export functionality
        print("  ✓ Testing export functionality...")
        export_result = engine.export_model('stl', 'test_gear.stl')
        assert export_result['success'], f"Export failed: {export_result.get('error', 'Unknown error')}"
        assert os.path.exists(export_result['filepath']), "Export file not created"
        print(f"    Exported to: {export_result['filepath']}")
        
        # Cleanup
        engine.close()
        
        print("✅ All CAD engine tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ CAD engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_dependencies():
    """Test that all required dependencies are available"""
    print("🧪 Testing dependencies...")
    
    required_packages = [
        'cadquery',
        'pyvista',
        'trimesh',
        'numpy',
        'websockets'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ❌ {package} - NOT INSTALLED")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("Please install with: pip install " + " ".join(missing_packages))
        return False
    else:
        print("✅ All dependencies available!")
        return True

def main():
    """Run all tests"""
    print("🚀 DigiForm CAD Engine Test Suite")
    print("=" * 50)
    
    # Test dependencies first
    if not test_dependencies():
        print("\n❌ Dependency test failed - cannot proceed")
        return False
    
    print()
    
    # Test CAD engine
    if not test_cad_engine():
        print("\n❌ CAD engine test failed")
        return False
    
    print("\n🎉 All tests passed! DigiForm CAD Engine is ready.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)