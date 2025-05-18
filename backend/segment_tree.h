#ifndef HDIMS_SEGMENT_TREE_H
#define HDIMS_SEGMENT_TREE_H

#include <vector>
#include <functional>
#include <stdexcept>
#include <string>
#include <ctime>
#include <iomanip>
#include <sstream>
#include <nlohmann/json.hpp>

namespace hdims {

// Utility function to convert date string to time_t
time_t dateToTimestamp(const std::string& dateStr) {
    std::tm tm = {};
    std::istringstream ss(dateStr);
    ss >> std::get_time(&tm, "%Y-%m-%d");
    return std::mktime(&tm);
}

// Utility function to convert time_t to date string
std::string timestampToDate(time_t timestamp) {
    std::tm* tm = std::localtime(&timestamp);
    std::ostringstream ss;
    ss << std::put_time(tm, "%Y-%m-%d");
    return ss.str();
}

// Generic Segment Tree implementation for range queries and updates
template <typename T, typename Op>
class SegmentTree {
private:
    std::vector<T> tree;
    std::vector<time_t> timestamps;
    std::vector<std::string> dates;
    size_t n;
    Op operation;
    T identity;

    // Build segment tree from array of values and timestamps
    void build(const std::vector<T>& values, const std::vector<time_t>& times, int node, int start, int end) {
        if (start == end) {
            tree[node] = values[start];
            return;
        }
        
        int mid = (start + end) / 2;
        build(values, times, 2*node+1, start, mid);
        build(values, times, 2*node+2, mid+1, end);
        
        tree[node] = operation(tree[2*node+1], tree[2*node+2]);
    }
    
    // Query the segment tree for a range
    T query(int node, int start, int end, int l, int r) const {
        if (r < start || end < l) {
            return identity;
        }
        
        if (l <= start && end <= r) {
            return tree[node];
        }
        
        int mid = (start + end) / 2;
        T left = query(2*node+1, start, mid, l, r);
        T right = query(2*node+2, mid+1, end, l, r);
        
        return operation(left, right);
    }
    
    // Update a single value in the segment tree
    void update(int node, int start, int end, int idx, T val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        
        int mid = (start + end) / 2;
        if (idx <= mid) {
            update(2*node+1, start, mid, idx, val);
        } else {
            update(2*node+2, mid+1, end, idx, val);
        }
        
        tree[node] = operation(tree[2*node+1], tree[2*node+2]);
    }
    
    // Find index of the closest date (binary search)
    int findClosestDateIndex(time_t timestamp) const {
        int low = 0;
        int high = timestamps.size() - 1;
        
        // If empty or out of range
        if (high < 0) return -1;
        if (timestamp <= timestamps[0]) return 0;
        if (timestamp >= timestamps[high]) return high;
        
        // Binary search
        while (low <= high) {
            int mid = (low + high) / 2;
            
            if (timestamps[mid] == timestamp) {
                return mid;
            } else if (timestamps[mid] < timestamp) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        
        // Return the closest date
        if (std::abs(timestamps[low] - timestamp) < std::abs(timestamps[high] - timestamp)) {
            return low;
        } else {
            return high;
        }
    }

public:
    SegmentTree(const std::vector<T>& values, const std::vector<std::string>& dateTimes, 
               Op op, T identityValue)
        : operation(op), identity(identityValue) {
        // Convert dates to timestamps
        timestamps.resize(dateTimes.size());
        dates = dateTimes;
        for (size_t i = 0; i < dateTimes.size(); i++) {
            timestamps[i] = dateToTimestamp(dateTimes[i]);
        }
        
        n = values.size();
        tree.resize(4 * n);
        
        // Build the segment tree
        build(values, timestamps, 0, 0, n-1);
    }
    
    // Query by date range
    T queryRange(const std::string& startDate, const std::string& endDate) const {
        time_t startTimestamp = dateToTimestamp(startDate);
        time_t endTimestamp = dateToTimestamp(endDate);
        
        int startIdx = findClosestDateIndex(startTimestamp);
        int endIdx = findClosestDateIndex(endTimestamp);
        
        if (startIdx == -1 || endIdx == -1 || startIdx > endIdx) {
            return identity;
        }
        
        return query(0, 0, n-1, startIdx, endIdx);
    }
    
    // Update a value by date
    void updateByDate(const std::string& date, T value) {
        time_t timestamp = dateToTimestamp(date);
        int idx = findClosestDateIndex(timestamp);
        
        if (idx == -1) {
            throw std::out_of_range("Date not found in segment tree");
        }
        
        update(0, 0, n-1, idx, value);
    }
    
    // Add a new date with a value
    void addDate(const std::string& date, T value) {
        time_t timestamp = dateToTimestamp(date);
        timestamps.push_back(timestamp);
        dates.push_back(date);
        
        // Rebuild the tree
        std::vector<T> values(timestamps.size());
        for (size_t i = 0; i < timestamps.size() - 1; i++) {
            values[i] = query(0, 0, n-1, i, i);
        }
        values[timestamps.size() - 1] = value;
        
        n = values.size();
        tree.resize(4 * n);
        
        // Build the segment tree
        build(values, timestamps, 0, 0, n-1);
    }
    
    // Get all data as JSON
    nlohmann::json toJson() const {
        nlohmann::json j;
        std::vector<nlohmann::json> dataPoints;
        
        for (size_t i = 0; i < n; i++) {
            nlohmann::json point;
            point["date"] = dates[i];
            point["value"] = query(0, 0, n-1, i, i);
            dataPoints.push_back(point);
        }
        
        j["data"] = dataPoints;
        return j;
    }
};

// Performance metric for doctors/hospitals
struct PerformanceMetric {
    double value;
    std::string metricType; // e.g., "response_time", "satisfaction_score"
    std::string entityId;   // doctor_id or hospital_id
    
    // Operator overloads for segment tree operations
    PerformanceMetric operator+(const PerformanceMetric& other) const {
        if (metricType != other.metricType || entityId != other.entityId) {
            return *this; // Only combine metrics of same type and entity
        }
        return {value + other.value, metricType, entityId};
    }
    
    PerformanceMetric operator/(int divisor) const {
        return {value / divisor, metricType, entityId};
    }
    
    // Convert to JSON
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["value"] = value;
        j["metric_type"] = metricType;
        j["entity_id"] = entityId;
        return j;
    }
};

// Sum operation for PerformanceMetric
struct SumOperation {
    PerformanceMetric operator()(const PerformanceMetric& a, const PerformanceMetric& b) const {
        if (a.metricType != b.metricType || a.entityId != b.entityId) {
            return a.value == 0 ? b : a; // Return non-zero value if types don't match
        }
        return {a.value + b.value, a.metricType, a.entityId};
    }
};

// Average operation for PerformanceMetric
struct AverageOperation {
    PerformanceMetric operator()(const PerformanceMetric& a, const PerformanceMetric& b) const {
        if (a.metricType != b.metricType || a.entityId != b.entityId) {
            return a.value == 0 ? b : a; // Return non-zero value if types don't match
        }
        return {(a.value + b.value) / 2.0, a.metricType, a.entityId};
    }
};

// Max operation for PerformanceMetric
struct MaxOperation {
    PerformanceMetric operator()(const PerformanceMetric& a, const PerformanceMetric& b) const {
        if (a.metricType != b.metricType || a.entityId != b.entityId) {
            return a.value == 0 ? b : a; // Return non-zero value if types don't match
        }
        return {std::max(a.value, b.value), a.metricType, a.entityId};
    }
};

// Type definitions for specialized segment trees
using SumSegmentTree = SegmentTree<PerformanceMetric, SumOperation>;
using AvgSegmentTree = SegmentTree<PerformanceMetric, AverageOperation>;
using MaxSegmentTree = SegmentTree<PerformanceMetric, MaxOperation>;

} // namespace hdims

#endif // HDIMS_SEGMENT_TREE_H