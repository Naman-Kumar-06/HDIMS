#ifndef HDIMS_DATA_MANAGER_H
#define HDIMS_DATA_MANAGER_H

#include <string>
#include <memory>
#include <vector>
#include <unordered_map>
#include <mutex>

#include "priority_queue.h"
#include "trie.h"
#include "graph.h"
#include "segment_tree.h"
#include "database.h"

namespace hdims {

// DataManager singleton class to coordinate all DSA components
class DataManager {
public:
    // Get singleton instance
    static DataManager& getInstance() {
        static DataManager instance;
        return instance;
    }
    
    // Initialize data structures
    void initialize();
    
    // Patient-related functions
    void addPatient(const PatientInfo& patient);
    std::vector<PatientInfo> searchPatients(const std::string& query);
    std::vector<PatientInfo> autocompletePatients(const std::string& prefix);
    
    // Disease-related functions
    void addDisease(const DiseaseInfo& disease);
    std::vector<DiseaseInfo> searchDiseases(const std::string& query);
    void updateDiseaseSpread(const std::string& location, const std::string& diseaseName, 
                             int caseCount, const std::string& date);
    std::vector<std::string> trackDiseaseSpread(const std::string& location);
    
    // Appointment-related functions
    int scheduleAppointment(const std::string& patientId, const std::string& doctorId,
                          const std::string& appointmentTime, int urgencyLevel,
                          const std::string& reason);
    AppointmentNode getNextUrgentAppointment();
    std::vector<AppointmentNode> getAppointmentsForDoctor(const std::string& doctorId);
    std::vector<AppointmentNode> getAppointmentsForPatient(const std::string& patientId);
    
    // Doctor referral functions
    void addDoctor(const DoctorNode& doctor);
    void addReferralPath(const std::string& fromDoctorId, const std::string& toDoctorId, int weight);
    std::pair<std::vector<std::string>, int> findOptimalReferralPath(
                                             const std::string& fromDoctorId, 
                                             const std::string& toDoctorId);
    
    // Performance metrics functions
    void recordPerformanceMetric(const std::string& entityId, const std::string& metricType,
                               double value, const std::string& date);
    double getAveragePerformance(const std::string& entityId, const std::string& metricType,
                               const std::string& startDate, const std::string& endDate);
    
    // Sync data with database (to be implemented)
    void syncWithDatabase();
    
private:
    DataManager() = default;
    ~DataManager() = default;
    DataManager(const DataManager&) = delete;
    DataManager& operator=(const DataManager&) = delete;
    
    // Data structures
    PatientTrie patientTrie;
    DiseaseTrie diseaseTrie;
    DiseaseSpreadGraph diseaseGraph;
    DoctorReferralGraph doctorGraph;
    AppointmentQueue appointmentQueue;
    
    // Performance metrics segment trees
    std::unordered_map<std::string, std::shared_ptr<AvgSegmentTree>> performanceMetrics;
    
    // Appointment storage
    std::unordered_map<int, AppointmentNode> appointments;
    std::unordered_map<std::string, std::vector<int>> doctorAppointments;
    std::unordered_map<std::string, std::vector<int>> patientAppointments;
    
    // Mutex for thread safety
    std::mutex mutex;
    
    // Next appointment ID
    int nextAppointmentId = 1000;
};

} // namespace hdims

#endif // HDIMS_DATA_MANAGER_H