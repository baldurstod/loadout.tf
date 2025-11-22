import { Box, Camera, ColorBackground, Cone, Cylinder, FirstPersonControl, FullScreenQuad, Group, Line, LineSegments, OrbitControl, Plane, Scene, Sphere } from 'harmony-3d';

export class Entities {
	// Basic entities
	Scene = Scene;
	Group = Group;

	// Camera
	Camera = Camera;

	// Camera controls
	OrbitControl = OrbitControl;
	FirstPersonControl = FirstPersonControl;

	// Primitives
	Box = Box;
	Cone = Cone;
	Cylinder = Cylinder;
	FullScreenQuad = FullScreenQuad;
	Line = Line;
	LineSegments = LineSegments;
	Plane = Plane;
	Sphere = Sphere;

	// Backgrounds
	ColorBackground = ColorBackground
}
