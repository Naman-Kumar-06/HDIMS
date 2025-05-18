/**
 * Data Structures and Algorithms implementations for HDIMS
 * This file contains JavaScript implementations of the DSA concepts required for the HDIMS project
 */

// ----- PRIORITY QUEUE (MIN-HEAP) FOR APPOINTMENTS -----
class AppointmentPriorityQueue {
    constructor() {
        this.heap = [];
    }
    
    // Helper methods for heap operations
    getParentIndex(i) { return Math.floor((i - 1) / 2); }
    getLeftChildIndex(i) { return 2 * i + 1; }
    getRightChildIndex(i) { return 2 * i + 2; }
    
    hasParent(i) { return this.getParentIndex(i) >= 0; }
    hasLeftChild(i) { return this.getLeftChildIndex(i) < this.heap.length; }
    hasRightChild(i) { return this.getRightChildIndex(i) < this.heap.length; }
    
    parent(i) { return this.heap[this.getParentIndex(i)]; }
    leftChild(i) { return this.heap[this.getLeftChildIndex(i)]; }
    rightChild(i) { return this.heap[this.getRightChildIndex(i)]; }
    
    // Swap elements
    swap(i, j) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }
    
    // Add an appointment to the queue
    enqueue(appointment) {
        this.heap.push(appointment);
        this.heapifyUp();
        return this.heap.length;
    }
    
    // Get the highest priority appointment without removing it
    peek() {
        if (this.heap.length === 0) {
            return null;
        }
        return this.heap[0];
    }
    
    // Remove and return the highest priority appointment
    dequeue() {
        if (this.heap.length === 0) {
            return null;
        }
        
        const item = this.heap[0];
        this.heap[0] = this.heap[this.heap.length - 1];
        this.heap.pop();
        this.heapifyDown();
        
        return item;
    }
    
    // Restore heap property upward
    heapifyUp() {
        let index = this.heap.length - 1;
        
        // Higher urgency has higher priority (lower value in min-heap)
        // If same urgency, earlier date has higher priority
        while (this.hasParent(index) && 
              (this.parent(index).urgency > this.heap[index].urgency || 
               (this.parent(index).urgency === this.heap[index].urgency && 
                new Date(this.parent(index).dateTime) > new Date(this.heap[index].dateTime)))) {
            this.swap(this.getParentIndex(index), index);
            index = this.getParentIndex(index);
        }
    }
    
    // Restore heap property downward
    heapifyDown() {
        let index = 0;
        
        while (this.hasLeftChild(index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);
            
            if (this.hasRightChild(index) && 
                (this.rightChild(index).urgency < this.leftChild(index).urgency || 
                 (this.rightChild(index).urgency === this.leftChild(index).urgency && 
                  new Date(this.rightChild(index).dateTime) < new Date(this.leftChild(index).dateTime)))) {
                smallerChildIndex = this.getRightChildIndex(index);
            }
            
            if (this.heap[index].urgency < this.heap[smallerChildIndex].urgency || 
                (this.heap[index].urgency === this.heap[smallerChildIndex].urgency && 
                 new Date(this.heap[index].dateTime) < new Date(this.heap[smallerChildIndex].dateTime))) {
                break;
            } else {
                this.swap(index, smallerChildIndex);
            }
            
            index = smallerChildIndex;
        }
    }
    
    // Get all appointments in priority order
    getAllAppointments() {
        // Clone the heap to avoid modifying the original
        const clonedHeap = [...this.heap];
        const result = [];
        
        // Extract all elements in priority order
        while (clonedHeap.length > 0) {
            const tempQueue = new AppointmentPriorityQueue();
            tempQueue.heap = clonedHeap;
            result.push(tempQueue.dequeue());
        }
        
        return result;
    }
    
    // Get the size of the queue
    size() {
        return this.heap.length;
    }
    
    // Check if the queue is empty
    isEmpty() {
        return this.heap.length === 0;
    }
}

// ----- TRIE FOR FAST SEARCH -----
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.data = [];
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }
    
    // Insert a word and associated data
    insert(word, data) {
        let current = this.root;
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i].toLowerCase();
            
            if (!current.children[char]) {
                current.children[char] = new TrieNode();
            }
            
            current = current.children[char];
        }
        
        current.isEndOfWord = true;
        current.data.push(data);
    }
    
    // Search for exact match
    search(word) {
        let current = this.root;
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i].toLowerCase();
            
            if (!current.children[char]) {
                return [];
            }
            
            current = current.children[char];
        }
        
        return current.isEndOfWord ? current.data : [];
    }
    
    // Get all words with a given prefix (autocomplete)
    autocomplete(prefix) {
        let current = this.root;
        const results = [];
        
        // Navigate to the node corresponding to the prefix
        for (let i = 0; i < prefix.length; i++) {
            const char = prefix[i].toLowerCase();
            
            if (!current.children[char]) {
                return [];
            }
            
            current = current.children[char];
        }
        
        // Collect all data items from this node and its children
        this._collectAllData(current, results);
        return results;
    }
    
    // Helper function to collect all data
    _collectAllData(node, results) {
        if (!node) return;
        
        if (node.isEndOfWord) {
            results.push(...node.data);
        }
        
        for (const char in node.children) {
            this._collectAllData(node.children[char], results);
        }
    }
}

// ----- GRAPH FOR DISEASE TRACKING AND DOCTOR REFERRAL -----
class Graph {
    constructor() {
        // Adjacency list for the graph
        this.adjacencyList = new Map();
        // Map to store node data
        this.nodes = new Map();
    }
    
    // Add a node to the graph
    addNode(nodeId, data) {
        this.nodes.set(nodeId, data);
        
        if (!this.adjacencyList.has(nodeId)) {
            this.adjacencyList.set(nodeId, []);
        }
    }
    
    // Add an edge between two nodes with a weight
    addEdge(from, to, weight = 1) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            throw new Error("Cannot add edge, one or both nodes don't exist");
        }
        
        this.adjacencyList.get(from).push({ to, weight });
    }
    
    // Check if a node exists
    hasNode(nodeId) {
        return this.nodes.has(nodeId);
    }
    
    // Get node data
    getNodeData(nodeId) {
        if (!this.nodes.has(nodeId)) {
            throw new Error("Node does not exist");
        }
        
        return this.nodes.get(nodeId);
    }
    
    // Get all neighbors of a node
    getNeighbors(nodeId) {
        if (!this.adjacencyList.has(nodeId)) {
            return [];
        }
        
        return this.adjacencyList.get(nodeId).map(edge => edge.to);
    }
    
    // Get all nodes
    getAllNodes() {
        return Array.from(this.nodes.keys());
    }
    
    // Breadth-First Search (BFS) to find all nodes reachable from start
    bfs(startNodeId) {
        if (!this.nodes.has(startNodeId)) {
            return [];
        }
        
        const result = [];
        const visited = new Set();
        const queue = [startNodeId];
        
        visited.add(startNodeId);
        
        while (queue.length > 0) {
            const currentNode = queue.shift();
            result.push(currentNode);
            
            const neighbors = this.adjacencyList.get(currentNode) || [];
            
            for (const neighbor of neighbors) {
                const neighborId = neighbor.to;
                
                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }
        
        return result;
    }
    
    // Dijkstra's algorithm to find shortest path between nodes
    dijkstra(startNodeId, endNodeId) {
        if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) {
            return { path: [], distance: -1 };
        }
        
        // Distance map
        const distances = new Map();
        // Previous node map for path reconstruction
        const previous = new Map();
        // Priority queue for Dijkstra's algorithm
        const queue = [];
        
        // Initialize distances
        for (const nodeId of this.nodes.keys()) {
            distances.set(nodeId, Infinity);
            previous.set(nodeId, null);
        }
        
        // Distance to start node is 0
        distances.set(startNodeId, 0);
        queue.push({ nodeId: startNodeId, distance: 0 });
        
        while (queue.length > 0) {
            // Sort by distance and get the node with smallest distance
            queue.sort((a, b) => a.distance - b.distance);
            const { nodeId: currentNode } = queue.shift();
            
            // If we've reached the end node, we can stop
            if (currentNode === endNodeId) {
                break;
            }
            
            const neighbors = this.adjacencyList.get(currentNode) || [];
            
            for (const neighbor of neighbors) {
                const { to: neighborId, weight } = neighbor;
                const distance = distances.get(currentNode) + weight;
                
                // If we found a shorter path to neighbor
                if (distance < distances.get(neighborId)) {
                    distances.set(neighborId, distance);
                    previous.set(neighborId, currentNode);
                    
                    // Add neighbor to queue
                    queue.push({ nodeId: neighborId, distance });
                }
            }
        }
        
        // Reconstruct path
        const path = [];
        let current = endNodeId;
        
        if (distances.get(endNodeId) === Infinity) {
            return { path: [], distance: -1 }; // No path exists
        }
        
        while (current !== null) {
            path.unshift(current);
            current = previous.get(current);
        }
        
        return { path, distance: distances.get(endNodeId) };
    }
}

// ----- SEGMENT TREE FOR PERFORMANCE METRICS -----
class SegmentTree {
    constructor(values, dates, operation, identityValue) {
        this.operation = operation;
        this.identity = identityValue;
        this.dates = dates;
        
        // Convert dates to timestamps
        this.timestamps = dates.map(date => new Date(date).getTime());
        
        this.n = values.length;
        this.tree = new Array(4 * this.n);
        
        // Build the segment tree
        this._build(values, 0, 0, this.n - 1);
    }
    
    // Build segment tree from array of values
    _build(values, node, start, end) {
        if (start === end) {
            this.tree[node] = values[start];
            return;
        }
        
        const mid = Math.floor((start + end) / 2);
        this._build(values, 2 * node + 1, start, mid);
        this._build(values, 2 * node + 2, mid + 1, end);
        
        this.tree[node] = this.operation(this.tree[2 * node + 1], this.tree[2 * node + 2]);
    }
    
    // Query the segment tree for a range
    _query(node, start, end, l, r) {
        if (r < start || end < l) {
            return this.identity;
        }
        
        if (l <= start && end <= r) {
            return this.tree[node];
        }
        
        const mid = Math.floor((start + end) / 2);
        const left = this._query(2 * node + 1, start, mid, l, r);
        const right = this._query(2 * node + 2, mid + 1, end, l, r);
        
        return this.operation(left, right);
    }
    
    // Update a single value in the segment tree
    _update(node, start, end, idx, val) {
        if (start === end) {
            this.tree[node] = val;
            return;
        }
        
        const mid = Math.floor((start + end) / 2);
        if (idx <= mid) {
            this._update(2 * node + 1, start, mid, idx, val);
        } else {
            this._update(2 * node + 2, mid + 1, end, idx, val);
        }
        
        this.tree[node] = this.operation(this.tree[2 * node + 1], this.tree[2 * node + 2]);
    }
    
    // Find index of the closest date (binary search)
    _findClosestDateIndex(timestamp) {
        let low = 0;
        let high = this.timestamps.length - 1;
        
        // If empty or out of range
        if (high < 0) return -1;
        if (timestamp <= this.timestamps[0]) return 0;
        if (timestamp >= this.timestamps[high]) return high;
        
        // Binary search
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            
            if (this.timestamps[mid] === timestamp) {
                return mid;
            } else if (this.timestamps[mid] < timestamp) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        
        // Return the closest date
        if (Math.abs(this.timestamps[low] - timestamp) < Math.abs(this.timestamps[high] - timestamp)) {
            return low;
        } else {
            return high;
        }
    }
    
    // Query by date range
    queryRange(startDate, endDate) {
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();
        
        const startIdx = this._findClosestDateIndex(startTimestamp);
        const endIdx = this._findClosestDateIndex(endTimestamp);
        
        if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
            return this.identity;
        }
        
        return this._query(0, 0, this.n - 1, startIdx, endIdx);
    }
    
    // Update a value by date
    updateByDate(date, value) {
        const timestamp = new Date(date).getTime();
        const idx = this._findClosestDateIndex(timestamp);
        
        if (idx === -1) {
            throw new Error("Date not found in segment tree");
        }
        
        this._update(0, 0, this.n - 1, idx, value);
    }
    
    // Get all data points
    getAllData() {
        const data = [];
        
        for (let i = 0; i < this.n; i++) {
            data.push({
                date: this.dates[i],
                value: this._query(0, 0, this.n - 1, i, i)
            });
        }
        
        return data;
    }
}

// ----- SAMPLE DATA AND UTILITIES -----

// Create sample data for appointments
function createSampleAppointments() {
    const appointments = [
        {
            id: 1001,
            patientId: "P1001",
            patientName: "John Smith",
            doctorId: "D1001",
            doctorName: "Dr. Sarah Johnson",
            dateTime: "2025-05-20T09:00:00",
            reason: "Annual checkup",
            urgency: 1, // Low
            status: "confirmed"
        },
        {
            id: 1002,
            patientId: "P1002",
            patientName: "Emily Davis",
            doctorId: "D1002",
            doctorName: "Dr. Michael Wong",
            dateTime: "2025-05-19T11:30:00",
            reason: "Flu symptoms",
            urgency: 2, // Medium
            status: "pending"
        },
        {
            id: 1003,
            patientId: "P1003",
            patientName: "Robert Johnson",
            doctorId: "D1003",
            doctorName: "Dr. Lisa Chen",
            dateTime: "2025-05-19T10:15:00",
            reason: "Severe headache",
            urgency: 3, // High
            status: "pending"
        },
        {
            id: 1004,
            patientId: "P1004",
            patientName: "Maria Rodriguez",
            doctorId: "D1001",
            doctorName: "Dr. Sarah Johnson",
            dateTime: "2025-05-19T14:00:00",
            reason: "Chest pain",
            urgency: 4, // Emergency
            status: "confirmed"
        },
        {
            id: 1005,
            patientId: "P1005",
            patientName: "David Wilson",
            doctorId: "D1002",
            doctorName: "Dr. Michael Wong",
            dateTime: "2025-05-21T15:30:00",
            reason: "Follow-up after surgery",
            urgency: 2, // Medium
            status: "pending"
        }
    ];
    
    return appointments;
}

// Create sample data for patients
function createSamplePatients() {
    const patients = [
        {
            id: "P1001",
            name: "John Smith",
            email: "john.smith@example.com",
            phone: "555-123-4567"
        },
        {
            id: "P1002",
            name: "Emily Davis",
            email: "emily.davis@example.com",
            phone: "555-234-5678"
        },
        {
            id: "P1003",
            name: "Robert Johnson",
            email: "robert.johnson@example.com",
            phone: "555-345-6789"
        },
        {
            id: "P1004",
            name: "Maria Rodriguez",
            email: "maria.rodriguez@example.com",
            phone: "555-456-7890"
        },
        {
            id: "P1005",
            name: "David Wilson",
            email: "david.wilson@example.com",
            phone: "555-567-8901"
        }
    ];
    
    return patients;
}

// Create sample data for diseases
function createSampleDiseases() {
    const diseases = [
        {
            name: "Influenza",
            description: "A contagious respiratory illness caused by influenza viruses.",
            symptoms: "Fever, cough, sore throat, body aches, fatigue",
            treatments: "Rest, fluids, antiviral medications"
        },
        {
            name: "Hypertension",
            description: "A condition in which the force of the blood against the artery walls is too high.",
            symptoms: "Often no symptoms, headaches, shortness of breath",
            treatments: "Medication, lifestyle changes, regular monitoring"
        },
        {
            name: "Type 2 Diabetes",
            description: "A chronic condition that affects the way the body processes blood sugar.",
            symptoms: "Increased thirst, frequent urination, hunger, fatigue",
            treatments: "Medication, insulin therapy, lifestyle changes"
        },
        {
            name: "Asthma",
            description: "A condition in which a person's airways become inflamed, narrow and swell.",
            symptoms: "Shortness of breath, chest tightness, coughing, wheezing",
            treatments: "Inhalers, medications, avoiding triggers"
        },
        {
            name: "Migraine",
            description: "A headache of varying intensity, often accompanied by nausea and sensitivity to light and sound.",
            symptoms: "Intense headache, nausea, sensitivity to light and sound",
            treatments: "Pain relievers, preventive medications, lifestyle changes"
        }
    ];
    
    return diseases;
}

// Create sample data for disease spread
function createSampleDiseaseSpread() {
    const diseaseSpread = [
        {
            location: "New York",
            diseaseName: "Influenza",
            caseCount: 120,
            date: "2025-04-15"
        },
        {
            location: "Los Angeles",
            diseaseName: "Influenza",
            caseCount: 85,
            date: "2025-04-16"
        },
        {
            location: "Chicago",
            diseaseName: "Influenza",
            caseCount: 65,
            date: "2025-04-17"
        },
        {
            location: "Houston",
            diseaseName: "Influenza",
            caseCount: 40,
            date: "2025-04-18"
        },
        {
            location: "Phoenix",
            diseaseName: "Influenza",
            caseCount: 30,
            date: "2025-04-19"
        }
    ];
    
    return diseaseSpread;
}

// Create sample data for doctors
function createSampleDoctors() {
    const doctors = [
        {
            id: "D1001",
            name: "Dr. Sarah Johnson",
            specialization: "Cardiology",
            hospital: "Central Hospital",
            rating: 4.8
        },
        {
            id: "D1002",
            name: "Dr. Michael Wong",
            specialization: "General Medicine",
            hospital: "Valley Medical Center",
            rating: 4.6
        },
        {
            id: "D1003",
            name: "Dr. Lisa Chen",
            specialization: "Neurology",
            hospital: "University Hospital",
            rating: 4.9
        },
        {
            id: "D1004",
            name: "Dr. James Wilson",
            specialization: "Pediatrics",
            hospital: "Children's Medical Center",
            rating: 4.7
        },
        {
            id: "D1005",
            name: "Dr. Emily Roberts",
            specialization: "Dermatology",
            hospital: "Skin Care Clinic",
            rating: 4.5
        }
    ];
    
    return doctors;
}

// Create sample performance metrics
function createSamplePerformanceMetrics() {
    const metrics = [
        {
            entityId: "D1001",
            metricType: "response_time",
            date: "2025-04-01",
            value: 15.2
        },
        {
            entityId: "D1001",
            metricType: "response_time",
            date: "2025-04-08",
            value: 14.8
        },
        {
            entityId: "D1001",
            metricType: "response_time",
            date: "2025-04-15",
            value: 13.5
        },
        {
            entityId: "D1001",
            metricType: "satisfaction_score",
            date: "2025-04-01",
            value: 4.5
        },
        {
            entityId: "D1001",
            metricType: "satisfaction_score",
            date: "2025-04-08",
            value: 4.7
        },
        {
            entityId: "D1001",
            metricType: "satisfaction_score",
            date: "2025-04-15",
            value: 4.8
        }
    ];
    
    return metrics;
}

// ----- EXPORT ALL IMPLEMENTATIONS -----
const DSA = {
    AppointmentPriorityQueue,
    Trie,
    Graph,
    SegmentTree,
    createSampleAppointments,
    createSamplePatients,
    createSampleDiseases,
    createSampleDiseaseSpread,
    createSampleDoctors,
    createSamplePerformanceMetrics
};

// Make DSA available globally
window.DSA = DSA;