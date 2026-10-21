# ai/route_opt.py
"""
AI Route Optimization for Blood Delivery and Ambulances.
Implements Dijkstra's algorithm to compute the fastest route through a graph network, 
dynamically updating weights based on simulated congestion, traffic conditions, road closures, 
and weather hazards.
"""

import heapq
import numpy as np

class CityLogisticsGraph:
    def __init__(self):
        # Nodes represent critical intersections/hospitals/blood banks in Hyderabad area
        # (Node ID: (Name, Lat, Lng))
        self.nodes = {
            'N1': ("Secunderabad Hub", 17.4399, 78.4983),
            'N2': ("Begumpet Junction", 17.4375, 78.4482),
            'N3': ("Jubilee Hills Checkpost", 17.4259, 78.4063),
            'N4': ("Gachibowli Ring", 17.4401, 78.3489),
            'N5': ("Banjara Hills Rd 1", 17.4162, 78.4431),
            'N6': ("Nampally Station", 17.3922, 78.4710),
            'N7': ("Charminar Area", 17.3616, 78.4746),
            'N8': ("Hitech City Gate", 17.4483, 78.3741),
        }
        
        # Edges represent roads: (Source, Target, Distance in km, Typical Speed km/h)
        self.edges = {
            'N1': [('N2', 5.5, 45), ('N6', 6.2, 35)],
            'N2': [('N1', 5.5, 45), ('N3', 4.8, 40), ('N5', 3.2, 30), ('N8', 7.5, 50)],
            'N3': [('N2', 4.8, 40), ('N5', 4.0, 35), ('N8', 3.5, 40), ('N4', 6.8, 55)],
            'N4': [('N3', 6.8, 55), ('N8', 4.2, 45)],
            'N5': [('N2', 3.2, 30), ('N3', 4.0, 35), ('N6', 3.8, 25)],
            'N6': [('N1', 6.2, 35), ('N5', 3.8, 25), ('N7', 4.5, 20)],
            'N7': [('N6', 4.5, 20)],
            'N8': [('N2', 7.5, 50), ('N3', 3.5, 40), ('N4', 4.2, 45)]
        }

    def optimize_route(self, start_node, end_node, live_traffic_modifiers=None, closed_edges=None):
        """
        Calculates optimized path using Dijkstra's algorithm.
        - live_traffic_modifiers: dict of edge tuples -> congestion multiplier (e.g. 2.0 = double time)
        - closed_edges: set of edge tuples that are completely closed
        """
        if live_traffic_modifiers is None:
            live_traffic_modifiers = {}
        if closed_edges is None:
            closed_edges = set()

        # Priority Queue: (Total Travel Time, Current Node, Path Taken)
        pq = [(0.0, start_node, [start_node])]
        visited = {}

        while pq:
            time_spent, current, path = heapq.heappop(pq)

            if current == end_node:
                return {
                    'path': path,
                    'travel_time_minutes': round(time_spent * 60, 1),
                    'path_details': [self.nodes[node][0] for node in path],
                    'coordinates': [[self.nodes[node][1], self.nodes[node][2]] for node in path]
                }

            if current in visited and visited[current] <= time_spent:
                continue
            visited[current] = time_spent

            for neighbor, distance_km, base_speed in self.edges.get(current, []):
                # Check if route is closed
                if (current, neighbor) in closed_edges or (neighbor, current) in closed_edges:
                    continue

                # Compute baseline time (hours)
                base_time = distance_km / base_speed
                
                # Apply traffic modifiers
                modifier = live_traffic_modifiers.get((current, neighbor), 1.0)
                actual_time = base_time * modifier

                heapq.heappush(pq, (time_spent + actual_time, neighbor, path + [neighbor]))

        return None # No route found

if __name__ == "__main__":
    graph = CityLogisticsGraph()
    
    # Run baseline optimization
    print("Baseline route from Secunderabad (N1) to Gachibowli (N4):")
    base_route = graph.optimize_route('N1', 'N4')
    print(f"Path: {' -> '.join(base_route['path_details'])}")
    print(f"ETA: {base_route['travel_time_minutes']} minutes\n")

    # Run optimization under heavy rush-hour traffic & road closure simulation
    print("Optimizing under heavy traffic modifiers and road closures:")
    # Simulation: Begumpet to Jubilee Hills is congested (x3 speed slowdown)
    traffic = {
        ('N2', 'N3'): 3.2,
        ('N3', 'N2'): 3.2
    }
    # Hitech City Gate (N8) to Gachibowli (N4) is temporarily closed
    closures = {('N8', 'N4'), ('N4', 'N8')}
    
    optimized = graph.optimize_route('N1', 'N4', live_traffic_modifiers=traffic, closed_edges=closures)
    if optimized:
        print(f"Path: {' -> '.join(optimized['path_details'])}")
        print(f"ETA: {optimized['travel_time_minutes']} minutes")
        print(f"Coordinates Trace: {optimized['coordinates']}")
    else:
        print("No viable route found.")
