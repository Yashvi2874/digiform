"""
PyVista Integration for DigiForm CAD Engine
Real-time 3D visualization with SolidWorks-like interface
"""
import pyvista as pv
import numpy as np
from typing import Optional, Tuple, List, Dict, Any
import asyncio
import websockets
import json
import threading
import io
import base64
from cadquery import Assembly, Workplane

class PyVistaRenderer:
    """PyVista-based 3D renderer for CAD models"""
    
    def __init__(self, width: int = 800, height: int = 600):
        self.width = width
        self.height = height
        self.plotter = None
        self.mesh = None
        self.camera_position = None
        
    def setup_plotter(self):
        """Initialize the PyVista plotter"""
        if self.plotter is None:
            self.plotter = pv.Plotter(window_size=(self.width, self.height), off_screen=True)
            self.plotter.set_background('white')
            
    def render_cad_model(self, model: Any, color: str = 'lightblue', 
                        show_edges: bool = True, show_centerline: bool = True) -> str:
        """
        Render a CAD model with optional centerline and return base64 encoded image
        """
        self.setup_plotter()
        
        try:
            # Convert CAD model to mesh
            mesh = self._cad_to_mesh(model)
            
            if mesh:
                # Clear previous actors
                self.plotter.clear()
                
                # Add the mesh
                self.plotter.add_mesh(
                    mesh, 
                    color=color,
                    show_edges=show_edges,
                    edge_color='black',
                    line_width=1
                )
                
                # Add centerline if available
                if show_centerline and hasattr(model, 'centerline'):
                    self._render_centerline(model.centerline, mesh)
                
                # Set up camera for isometric view
                self._setup_camera(mesh)
                
                # Render to image
                image = self.plotter.screenshot(return_img=True)
                
                # Convert to base64 for web transmission
                img_buffer = io.BytesIO()
                pv.write_array(image, img_buffer, 'png')
                img_buffer.seek(0)
                base64_image = base64.b64encode(img_buffer.read()).decode('utf-8')
                
                return base64_image
                
        except Exception as e:
            print(f"Rendering error: {e}")
            return self._get_error_image()
        
        return self._get_error_image()
    
    def _render_centerline(self, centerline: Any, mesh: pv.PolyData):
        """Render centerline/reference axes on the model"""
        try:
            axes_data = centerline.get_axes_data()
            
            for axis_name, axis_info in axes_data.items():
                start = np.array(axis_info['start'])
                end = np.array(axis_info['end'])
                color = axis_info.get('color', 'red')
                style = axis_info.get('style', 'solid')
                
                # Create line
                line = pv.Line(start, end)
                
                # Add line to plotter with style
                if style == 'dashed':
                    # Dashed line representation
                    self.plotter.add_mesh(
                        line,
                        color=color,
                        line_width=2,
                        label=f'{axis_name}-axis (centerline)',
                        render_lines_as_tubes=True
                    )
                else:
                    # Solid line
                    self.plotter.add_mesh(
                        line,
                        color=color,
                        line_width=1.5,
                        label=f'{axis_name}-axis',
                        render_lines_as_tubes=False
                    )
                
                # Add small sphere at origin
                origin_sphere = pv.Sphere(radius=2, center=(0, 0, 0))
                self.plotter.add_mesh(
                    origin_sphere,
                    color='black',
                    opacity=0.8,
                    label='Origin (0, 0, 0)'
                )
                
        except Exception as e:
            print(f"Error rendering centerline: {e}")
    
    def _cad_to_mesh(self, model: Any) -> Optional[pv.PolyData]:
        """Convert CAD model to PyVista mesh"""
        try:
            # Handle different CAD model types
            if hasattr(model, 'toVtkPolyData'):
                # OpenCascade model
                vtk_data = model.toVtkPolyData()
                return pv.wrap(vtk_data)
            elif hasattr(model, 'vals'):
                # CadQuery model
                shapes = model.vals()
                if shapes:
                    # Get the first solid
                    solid = shapes[0]
                    if hasattr(solid, 'toVtkPolyData'):
                        vtk_data = solid.toVtkPolyData()
                        return pv.wrap(vtk_data)
            elif isinstance(model, Assembly):
                # CadQuery assembly
                # This is more complex - would need to extract individual parts
                pass
                
        except Exception as e:
            print(f"CAD to mesh conversion error: {e}")
            
        return None
    
    def _setup_camera(self, mesh: pv.PolyData):
        """Set up camera for optimal viewing"""
        # Get mesh bounds
        bounds = mesh.bounds
        center = mesh.center
        
        # Calculate optimal camera distance
        size = max(bounds[1] - bounds[0], bounds[3] - bounds[2], bounds[5] - bounds[4])
        distance = size * 1.5
        
        # Set isometric view
        camera_position = [
            center[0] + distance * 0.7,
            center[1] + distance * 0.7,
            center[2] + distance * 0.7
        ]
        
        self.plotter.camera.position = camera_position
        self.plotter.camera.focal_point = center
        self.plotter.camera.up = [0, 0, 1]
        self.plotter.camera.zoom(1.0)
    
    def _get_error_image(self) -> str:
        """Generate error image when rendering fails"""
        # Create simple error image
        error_img = np.ones((self.height, self.width, 3), dtype=np.uint8) * 200
        # Add red cross
        cv2 = __import__('cv2')  # Import only if needed
        cv2.line(error_img, (50, 50), (self.width-50, self.height-50), (0, 0, 255), 5)
        cv2.line(error_img, (self.width-50, 50), (50, self.height-50), (0, 0, 255), 5)
        
        img_buffer = io.BytesIO()
        import PIL.Image as Image
        Image.fromarray(error_img).save(img_buffer, format='PNG')
        img_buffer.seek(0)
        return base64.b64encode(img_buffer.read()).decode('utf-8')
    
    def close(self):
        """Clean up resources"""
        if self.plotter:
            self.plotter.close()

class RealTimeViewer:
    """Real-time 3D viewer with WebSocket communication"""
    
    def __init__(self, host: str = 'localhost', port: int = 8765):
        self.host = host
        self.port = port
        self.renderer = PyVistaRenderer()
        self.current_model = None
        self.websocket_server = None
        
    async def handle_client(self, websocket, path):
        """Handle WebSocket client connections"""
        print(f"Client connected: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    response = await self.process_message(data, websocket)
                    if response:
                        await websocket.send(json.dumps(response))
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Invalid JSON message'
                    }))
                except Exception as e:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': f'Processing error: {str(e)}'
                    }))
                    
        except websockets.exceptions.ConnectionClosed:
            print(f"Client disconnected: {websocket.remote_address}")
        except Exception as e:
            print(f"WebSocket error: {e}")
    
    async def process_message(self, data: Dict[str, Any], websocket) -> Optional[Dict[str, Any]]:
        """Process incoming WebSocket messages"""
        message_type = data.get('type')
        
        if message_type == 'update_model':
            return await self.handle_model_update(data)
        elif message_type == 'camera_control':
            return await self.handle_camera_control(data)
        elif message_type == 'feature_tree':
            return await self.handle_feature_tree(data)
        elif message_type == 'render_request':
            return await self.handle_render_request(data)
        else:
            return {
                'type': 'error',
                'message': f'Unknown message type: {message_type}'
            }
    
    async def handle_model_update(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle model update requests"""
        try:
            # This would integrate with your CAD engine
            # For now, simulate model update
            model_data = data.get('model', {})
            
            # Update current model (implementation depends on your CAD engine)
            # self.current_model = update_cad_model(model_data)
            
            return {
                'type': 'model_updated',
                'status': 'success',
                'message': 'Model updated successfully'
            }
        except Exception as e:
            return {
                'type': 'error',
                'message': f'Model update failed: {str(e)}'
            }
    
    async def handle_camera_control(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle camera control messages"""
        try:
            action = data.get('action')
            if action == 'rotate':
                # Handle rotation
                pass
            elif action == 'zoom':
                # Handle zoom
                pass
            elif action == 'pan':
                # Handle pan
                pass
            
            # Return current camera state
            return {
                'type': 'camera_state',
                'position': self.renderer.plotter.camera.position if self.renderer.plotter else [0, 0, 100],
                'focal_point': self.renderer.plotter.camera.focal_point if self.renderer.plotter else [0, 0, 0],
                'view_up': self.renderer.plotter.camera.up if self.renderer.plotter else [0, 0, 1]
            }
        except Exception as e:
            return {
                'type': 'error',
                'message': f'Camera control error: {str(e)}'
            }
    
    async def handle_feature_tree(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle feature tree requests"""
        try:
            # Return feature tree structure
            # This would integrate with your CAD engine's feature management
            feature_tree = {
                'root': {
                    'name': 'Part1',
                    'type': 'Part',
                    'children': [
                        {
                            'name': 'Sketch1',
                            'type': 'Sketch',
                            'parameters': {}
                        },
                        {
                            'name': 'Extrude1',
                            'type': 'Extrude',
                            'parameters': {}
                        }
                    ]
                }
            }
            
            return {
                'type': 'feature_tree',
                'tree': feature_tree
            }
        except Exception as e:
            return {
                'type': 'error',
                'message': f'Feature tree error: {str(e)}'
            }
    
    async def handle_render_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle render requests"""
        try:
            if self.current_model:
                image_data = self.renderer.render_cad_model(self.current_model)
                return {
                    'type': 'render_result',
                    'image': image_data,
                    'format': 'png'
                }
            else:
                return {
                    'type': 'error',
                    'message': 'No model available to render'
                }
        except Exception as e:
            return {
                'type': 'error',
                'message': f'Render error: {str(e)}'
            }
    
    async def start_server(self):
        """Start the WebSocket server"""
        self.websocket_server = await websockets.serve(
            self.handle_client, 
            self.host, 
            self.port
        )
        print(f"WebSocket server started on {self.host}:{self.port}")
        
        # Keep server running
        await self.websocket_server.wait_closed()
    
    def start_server_sync(self):
        """Start server in a synchronous thread"""
        def run_server():
            asyncio.run(self.start_server())
        
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        return server_thread

class CADViewport:
    """Main CAD viewport class for integration with web frontend"""
    
    def __init__(self, width: int = 800, height: int = 600):
        self.renderer = PyVistaRenderer(width, height)
        self.viewer = RealTimeViewer()
        self.server_thread = None
    
    def start_realtime_viewer(self):
        """Start the real-time viewer server"""
        self.server_thread = self.viewer.start_server_sync()
        return self.server_thread
    
    def render_model(self, model: Any, **kwargs) -> str:
        """Render a model and return base64 image"""
        return self.renderer.render_cad_model(model, **kwargs)
    
    def update_model(self, model: Any):
        """Update the current model"""
        self.viewer.current_model = model
    
    def get_camera_state(self) -> Dict[str, Any]:
        """Get current camera state"""
        if self.renderer.plotter:
            return {
                'position': self.renderer.plotter.camera.position,
                'focal_point': self.renderer.plotter.camera.focal_point,
                'view_up': self.renderer.plotter.camera.up
            }
        return {}
    
    def close(self):
        """Clean up resources"""
        self.renderer.close()

# Example usage
if __name__ == "__main__":
    # Create viewport
    viewport = CADViewport(800, 600)
    
    # Start real-time viewer
    server_thread = viewport.start_realtime_viewer()
    print("CAD Viewer server started - connect via WebSocket to localhost:8765")
    
    # Example rendering (would integrate with actual CAD models)
    try:
        # This is a placeholder - you'd pass actual CAD models here
        # image_data = viewport.render_model(your_cad_model)
        # print(f"Image size: {len(image_data)} bytes")
        pass
    except Exception as e:
        print(f"Example error: {e}")
    
    # Keep running
    try:
        server_thread.join()
    except KeyboardInterrupt:
        print("Shutting down...")
        viewport.close()