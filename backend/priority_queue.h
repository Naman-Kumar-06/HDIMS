#ifndef HDIMS_PRIORITY_QUEUE_H
#define HDIMS_PRIORITY_QUEUE_H

#include <vector>
#include <functional>
#include <algorithm>
#include <stdexcept>
#include <string>
#include <nlohmann/json.hpp>

namespace hdims {

// Appointment structure for priority queue
struct AppointmentNode {
    int id;
    std::string patientId;
    std::string doctorId;
    std::string appointmentTime;
    int urgencyLevel; // 1 = low, 2 = medium, 3 = high, 4 = emergency
    std::string reason;
    std::string status;

    // Constructor
    AppointmentNode(int id, std::string patientId, std::string doctorId, 
                    std::string appointmentTime, int urgencyLevel, 
                    std::string reason, std::string status = "pending")
        : id(id), patientId(patientId), doctorId(doctorId), 
          appointmentTime(appointmentTime), urgencyLevel(urgencyLevel),
          reason(reason), status(status) {}

    // Convert to JSON representation
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["id"] = id;
        j["patient_id"] = patientId;
        j["doctor_id"] = doctorId;
        j["appointment_time"] = appointmentTime;
        j["urgency_level"] = urgencyLevel;
        j["reason"] = reason;
        j["status"] = status;
        return j;
    }

    // Create from JSON
    static AppointmentNode fromJson(const nlohmann::json& j) {
        return AppointmentNode(
            j["id"].get<int>(),
            j["patient_id"].get<std::string>(),
            j["doctor_id"].get<std::string>(),
            j["appointment_time"].get<std::string>(),
            j["urgency_level"].get<int>(),
            j["reason"].get<std::string>(),
            j["status"].get<std::string>()
        );
    }
};

// Min-heap implementation for priority queue based on urgency level
template <typename T, typename Compare = std::less<T>>
class PriorityQueue {
public:
    PriorityQueue() : comp(Compare()) {}

    // Add item to the priority queue
    void push(const T& item) {
        data.push_back(item);
        std::push_heap(data.begin(), data.end(), comp);
    }

    // Get the highest priority item (without removing)
    const T& top() const {
        if (data.empty()) {
            throw std::out_of_range("Priority queue is empty");
        }
        return data.front();
    }

    // Remove the highest priority item
    void pop() {
        if (data.empty()) {
            throw std::out_of_range("Priority queue is empty");
        }
        std::pop_heap(data.begin(), data.end(), comp);
        data.pop_back();
    }

    // Get and remove the highest priority item
    T popTop() {
        if (data.empty()) {
            throw std::out_of_range("Priority queue is empty");
        }
        T top_item = data.front();
        std::pop_heap(data.begin(), data.end(), comp);
        data.pop_back();
        return top_item;
    }

    // Check if the priority queue is empty
    bool empty() const {
        return data.empty();
    }

    // Get the number of items in the priority queue
    size_t size() const {
        return data.size();
    }

    // Get all items in the priority queue (for display purposes)
    std::vector<T> getAllItems() const {
        return data;
    }

private:
    std::vector<T> data;
    Compare comp;
};

// Comparator for appointments based on urgency level
struct AppointmentUrgencyComparator {
    bool operator()(const AppointmentNode& a, const AppointmentNode& b) const {
        // Higher urgency level has higher priority (lower value in min-heap)
        if (a.urgencyLevel != b.urgencyLevel) {
            return a.urgencyLevel < b.urgencyLevel;
        }
        // If urgency is the same, earlier appointment time has higher priority
        return a.appointmentTime > b.appointmentTime;
    }
};

// Specialization of priority queue for appointments
using AppointmentQueue = PriorityQueue<AppointmentNode, AppointmentUrgencyComparator>;

} // namespace hdims

#endif // HDIMS_PRIORITY_QUEUE_H