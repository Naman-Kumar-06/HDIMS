#ifndef HDIMS_GRAPH_H
#define HDIMS_GRAPH_H

#include <unordered_map>
#include <vector>
#include <queue>
#include <limits>
#include <algorithm>
#include <string>
#include <memory>
#include <nlohmann/json.hpp>

namespace hdims {

// Generic graph implementation using adjacency list
template <typename T>
class Graph {
private:
    // Adjacency list representation
    std::unordered_map<std::string, std::vector<std::pair<std::string, int>>> adjacencyList;
    
    // Map of nodes with their data
    std::unordered_map<std::string, T> nodes;

public:
    // Add a node to the graph
    void addNode(const std::string& nodeId, const T& nodeData) {
        nodes[nodeId] = nodeData;
        // Initialize empty adjacency list if not exists
        if (adjacencyList.find(nodeId) == adjacencyList.end()) {
            adjacencyList[nodeId] = {};
        }
    }
    
    // Add an edge between two nodes with a weight
    void addEdge(const std::string& from, const std::string& to, int weight = 1) {
        // Make sure both nodes exist
        if (nodes.find(from) == nodes.end() || nodes.find(to) == nodes.end()) {
            throw std::invalid_argument("Cannot add edge, one or both nodes don't exist");
        }
        
        // Add edge from -> to with weight
        adjacencyList[from].push_back({to, weight});
    }
    
    // Check if a node exists
    bool hasNode(const std::string& nodeId) const {
        return nodes.find(nodeId) != nodes.end();
    }
    
    // Get node data
    const T& getNodeData(const std::string& nodeId) const {
        auto it = nodes.find(nodeId);
        if (it == nodes.end()) {
            throw std::invalid_argument("Node does not exist");
        }
        return it->second;
    }
    
    // Get all neighbors of a node
    std::vector<std::string> getNeighbors(const std::string& nodeId) const {
        auto it = adjacencyList.find(nodeId);
        if (it == adjacencyList.end()) {
            return {};
        }
        
        std::vector<std::string> neighbors;
        for (const auto& edge : it->second) {
            neighbors.push_back(edge.first);
        }
        return neighbors;
    }
    
    // Get all nodes
    std::vector<std::string> getAllNodes() const {
        std::vector<std::string> nodeList;
        for (const auto& node : nodes) {
            nodeList.push_back(node.first);
        }
        return nodeList;
    }
    
    // Breadth-First Search (BFS) to find all nodes reachable from start
    std::vector<std::string> bfs(const std::string& startNodeId) const {
        if (nodes.find(startNodeId) == nodes.end()) {
            return {};
        }
        
        std::vector<std::string> result;
        std::unordered_map<std::string, bool> visited;
        std::queue<std::string> queue;
        
        // Mark start node as visited and enqueue it
        visited[startNodeId] = true;
        queue.push(startNodeId);
        
        while (!queue.empty()) {
            // Dequeue a node
            std::string currentNode = queue.front();
            queue.pop();
            result.push_back(currentNode);
            
            // Get all adjacent nodes
            auto it = adjacencyList.find(currentNode);
            if (it != adjacencyList.end()) {
                for (const auto& neighbor : it->second) {
                    std::string neighborId = neighbor.first;
                    // If not visited, mark as visited and enqueue
                    if (visited.find(neighborId) == visited.end()) {
                        visited[neighborId] = true;
                        queue.push(neighborId);
                    }
                }
            }
        }
        
        return result;
    }
    
    // Dijkstra's algorithm to find shortest path between nodes
    std::pair<std::vector<std::string>, int> dijkstra(const std::string& startNodeId, const std::string& endNodeId) const {
        if (nodes.find(startNodeId) == nodes.end() || nodes.find(endNodeId) == nodes.end()) {
            return {{}, -1}; // Return empty path and -1 distance if nodes don't exist
        }
        
        // Distance map
        std::unordered_map<std::string, int> distance;
        // Previous node map for path reconstruction
        std::unordered_map<std::string, std::string> previous;
        // Priority queue for Dijkstra's algorithm
        std::priority_queue<std::pair<int, std::string>, 
                           std::vector<std::pair<int, std::string>>,
                           std::greater<std::pair<int, std::string>>> pq;
        
        // Initialize distances
        for (const auto& node : nodes) {
            distance[node.first] = std::numeric_limits<int>::max();
            previous[node.first] = "";
        }
        
        // Distance to start node is 0
        distance[startNodeId] = 0;
        pq.push({0, startNodeId});
        
        while (!pq.empty()) {
            std::string currentNode = pq.top().second;
            int currentDistance = pq.top().first;
            pq.pop();
            
            // If we've reached the end node, we can stop
            if (currentNode == endNodeId) {
                break;
            }
            
            // If we've processed this node with a better distance already, skip
            if (currentDistance > distance[currentNode]) {
                continue;
            }
            
            // Check all neighbors
            auto it = adjacencyList.find(currentNode);
            if (it != adjacencyList.end()) {
                for (const auto& neighbor : it->second) {
                    std::string neighborId = neighbor.first;
                    int weight = neighbor.second;
                    
                    // If we found a shorter path to neighbor
                    if (distance[currentNode] + weight < distance[neighborId]) {
                        distance[neighborId] = distance[currentNode] + weight;
                        previous[neighborId] = currentNode;
                        pq.push({distance[neighborId], neighborId});
                    }
                }
            }
        }
        
        // Reconstruct path
        std::vector<std::string> path;
        if (distance[endNodeId] == std::numeric_limits<int>::max()) {
            return {{}, -1}; // No path exists
        }
        
        for (std::string at = endNodeId; at != ""; at = previous[at]) {
            path.push_back(at);
        }
        std::reverse(path.begin(), path.end());
        
        return {path, distance[endNodeId]};
    }
    
    // Convert graph to JSON for API responses
    nlohmann::json toJson() const {
        nlohmann::json j;
        
        // Add nodes
        nlohmann::json nodesJson = nlohmann::json::array();
        for (const auto& node : nodes) {
            nlohmann::json nodeJson;
            nodeJson["id"] = node.first;
            nodeJson["data"] = node.second;
            nodesJson.push_back(nodeJson);
        }
        j["nodes"] = nodesJson;
        
        // Add edges
        nlohmann::json edgesJson = nlohmann::json::array();
        for (const auto& source : adjacencyList) {
            for (const auto& target : source.second) {
                nlohmann::json edgeJson;
                edgeJson["source"] = source.first;
                edgeJson["target"] = target.first;
                edgeJson["weight"] = target.second;
                edgesJson.push_back(edgeJson);
            }
        }
        j["edges"] = edgesJson;
        
        return j;
    }
};

// Doctor information for referral graph
struct DoctorNode {
    std::string id;
    std::string name;
    std::string specialization;
    std::string hospital;
    double rating;
    
    // Convert to JSON
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["id"] = id;
        j["name"] = name;
        j["specialization"] = specialization;
        j["hospital"] = hospital;
        j["rating"] = rating;
        return j;
    }
};

// Disease spread information
struct DiseaseSpreadNode {
    std::string location;
    std::string diseaseName;
    int caseCount;
    std::string date;
    
    // Convert to JSON
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["location"] = location;
        j["disease_name"] = diseaseName;
        j["case_count"] = caseCount;
        j["date"] = date;
        return j;
    }
};

// Type definitions for specialized graphs
using DoctorReferralGraph = Graph<DoctorNode>;
using DiseaseSpreadGraph = Graph<DiseaseSpreadNode>;

} // namespace hdims

#endif // HDIMS_GRAPH_H