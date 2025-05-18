#include "data_manager.h"
#include <iostream>
#include <algorithm>
#include <random>

namespace hdims {

void DataManager::initialize() {
    std::lock_guard<std::mutex> lock(mutex);
    
    std::cout << "Initializing HDIMS Data Manager with DSA components..." << std::endl;
    
    // Initialize any initial data (could be loaded from database in real implementation)
    
    // Reset appointment ID
    nextAppointmentId = 1000;
    
    std::cout << "Data Manager initialized successfully." << std::endl;
}

// Patient-related functions
void DataManager::addPatient(const PatientInfo& patient) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Add to trie for fast search
    patientTrie.insert(patient.name, patient);
}

std::vector<PatientInfo> DataManager::searchPatients(const std::string& query) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Search in trie
    return patientTrie.search(query);
}

std::vector<PatientInfo> DataManager::autocompletePatients(const std::string& prefix) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Get autocomplete suggestions from trie
    return patientTrie.autocomplete(prefix);
}

// Disease-related functions
void DataManager::addDisease(const DiseaseInfo& disease) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Add to trie for fast search
    diseaseTrie.insert(disease.name, disease);
}

std::vector<DiseaseInfo> DataManager::searchDiseases(const std::string& query) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Search in trie
    return diseaseTrie.search(query);
}

void DataManager::updateDiseaseSpread(const std::string& location, const std::string& diseaseName, 
                                     int caseCount, const std::string& date) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Create a unique node ID
    std::string nodeId = location + "_" + diseaseName + "_" + date;
    
    // Create disease spread node
    DiseaseSpreadNode node;
    node.location = location;
    node.diseaseName = diseaseName;
    node.caseCount = caseCount;
    node.date = date;
    
    // Add node to graph
    diseaseGraph.addNode(nodeId, node);
    
    // Connect to existing nodes for this disease
    auto allNodes = diseaseGraph.getAllNodes();
    for (const auto& existingNodeId : allNodes) {
        if (existingNodeId != nodeId) {
            DiseaseSpreadNode existingNode = diseaseGraph.getNodeData(existingNodeId);
            
            // Connect nodes if they represent the same disease
            if (existingNode.diseaseName == diseaseName) {
                // Weight could be based on geographic proximity or time difference
                // Here we use a simple weight of 1
                diseaseGraph.addEdge(existingNodeId, nodeId, 1);
            }
        }
    }
}

std::vector<std::string> DataManager::trackDiseaseSpread(const std::string& location) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Find a node for the given location
    auto allNodes = diseaseGraph.getAllNodes();
    for (const auto& nodeId : allNodes) {
        DiseaseSpreadNode node = diseaseGraph.getNodeData(nodeId);
        if (node.location == location) {
            // Perform BFS to find all connected nodes (disease spread)
            return diseaseGraph.bfs(nodeId);
        }
    }
    
    return {}; // No data for this location
}

// Appointment-related functions
int DataManager::scheduleAppointment(const std::string& patientId, const std::string& doctorId,
                                   const std::string& appointmentTime, int urgencyLevel,
                                   const std::string& reason) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Generate appointment ID
    int appointmentId = nextAppointmentId++;
    
    // Create appointment
    AppointmentNode appointment(appointmentId, patientId, doctorId, appointmentTime, 
                             urgencyLevel, reason);
    
    // Add to appointment queue based on urgency
    appointmentQueue.push(appointment);
    
    // Store in maps for easy retrieval
    appointments[appointmentId] = appointment;
    doctorAppointments[doctorId].push_back(appointmentId);
    patientAppointments[patientId].push_back(appointmentId);
    
    return appointmentId;
}

AppointmentNode DataManager::getNextUrgentAppointment() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (appointmentQueue.empty()) {
        throw std::runtime_error("No appointments in queue");
    }
    
    // Get highest priority appointment based on urgency
    return appointmentQueue.popTop();
}

std::vector<AppointmentNode> DataManager::getAppointmentsForDoctor(const std::string& doctorId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    std::vector<AppointmentNode> result;
    
    auto it = doctorAppointments.find(doctorId);
    if (it != doctorAppointments.end()) {
        for (int appointmentId : it->second) {
            auto appIt = appointments.find(appointmentId);
            if (appIt != appointments.end()) {
                result.push_back(appIt->second);
            }
        }
    }
    
    return result;
}

std::vector<AppointmentNode> DataManager::getAppointmentsForPatient(const std::string& patientId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    std::vector<AppointmentNode> result;
    
    auto it = patientAppointments.find(patientId);
    if (it != patientAppointments.end()) {
        for (int appointmentId : it->second) {
            auto appIt = appointments.find(appointmentId);
            if (appIt != appointments.end()) {
                result.push_back(appIt->second);
            }
        }
    }
    
    return result;
}

// Doctor referral functions
void DataManager::addDoctor(const DoctorNode& doctor) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Add to doctor referral graph
    doctorGraph.addNode(doctor.id, doctor);
}

void DataManager::addReferralPath(const std::string& fromDoctorId, const std::string& toDoctorId, int weight) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Add edge to graph
    doctorGraph.addEdge(fromDoctorId, toDoctorId, weight);
}

std::pair<std::vector<std::string>, int> DataManager::findOptimalReferralPath(
                                         const std::string& fromDoctorId, 
                                         const std::string& toDoctorId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Use Dijkstra's algorithm to find shortest path
    return doctorGraph.dijkstra(fromDoctorId, toDoctorId);
}

// Performance metrics functions
void DataManager::recordPerformanceMetric(const std::string& entityId, const std::string& metricType,
                                       double value, const std::string& date) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Create a unique key for this metric type and entity
    std::string key = metricType + "_" + entityId;
    
    // Create performance metric
    PerformanceMetric metric;
    metric.value = value;
    metric.metricType = metricType;
    metric.entityId = entityId;
    
    // Add to segment tree
    auto it = performanceMetrics.find(key);
    if (it != performanceMetrics.end()) {
        // Update existing segment tree
        it->second->updateByDate(date, metric);
    } else {
        // Create new segment tree with initial data
        std::vector<PerformanceMetric> initialData = {metric};
        std::vector<std::string> dates = {date};
        
        performanceMetrics[key] = std::make_shared<AvgSegmentTree>(
            initialData, dates, AverageOperation(), 
            PerformanceMetric{0.0, metricType, entityId}
        );
    }
}

double DataManager::getAveragePerformance(const std::string& entityId, const std::string& metricType,
                                       const std::string& startDate, const std::string& endDate) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Create a unique key for this metric type and entity
    std::string key = metricType + "_" + entityId;
    
    auto it = performanceMetrics.find(key);
    if (it != performanceMetrics.end()) {
        // Query the segment tree for the date range
        PerformanceMetric result = it->second->queryRange(startDate, endDate);
        return result.value;
    }
    
    return 0.0; // No data available
}

void DataManager::syncWithDatabase() {
    // This would connect to the actual database and sync data
    // For now, we'll just print a message
    std::cout << "Syncing data structures with database..." << std::endl;
    
    try {
        auto& db = Database::getInstance();
        auto conn = db.getConnection();
        
        // Here we would load data from database tables into our data structures
        // This is a simplified example
        
        std::cout << "Data synced successfully." << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error syncing with database: " << e.what() << std::endl;
    }
}

} // namespace hdims