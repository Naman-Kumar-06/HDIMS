import heapq
from collections import defaultdict, deque
from datetime import datetime, timedelta
import logging

class TrieNode:
    """Node for Trie data structure"""
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False
        self.frequency = 0
        self.data = []

class Trie:
    """Trie data structure for efficient search with autocomplete"""
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word, data=None):
        """Insert a word into the Trie with associated data"""
        node = self.root
        word = word.lower().strip()
        
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        
        node.is_end_of_word = True
        node.frequency += 1
        if data:
            node.data.append(data)
    
    def search(self, word):
        """Search for exact word match"""
        node = self.root
        word = word.lower().strip()
        
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        
        return node.is_end_of_word
    
    def starts_with(self, prefix, limit=10):
        """Find all words that start with given prefix"""
        node = self.root
        prefix = prefix.lower().strip()
        
        # Navigate to prefix
        for char in prefix:
            if char not in node.children:
                return []
            node = node.children[char]
        
        # Collect all words with this prefix
        results = []
        self._collect_words(node, prefix, results, limit)
        
        # Sort by frequency (most searched first)
        results.sort(key=lambda x: x[1], reverse=True)
        return [word for word, freq, data in results[:limit]]
    
    def _collect_words(self, node, prefix, results, limit):
        """Helper method to collect words from a node"""
        if len(results) >= limit:
            return
        
        if node.is_end_of_word:
            results.append((prefix, node.frequency, node.data))
        
        for char, child_node in node.children.items():
            self._collect_words(child_node, prefix + char, results, limit)

    def get_suggestions_with_data(self, prefix, limit=10):
        """Get suggestions with associated data"""
        node = self.root
        prefix = prefix.lower().strip()
        
        for char in prefix:
            if char not in node.children:
                return []
            node = node.children[char]
        
        results = []
        self._collect_words_with_data(node, prefix, results, limit)
        results.sort(key=lambda x: x[1], reverse=True)
        return [(word, data) for word, freq, data in results[:limit]]
    
    def _collect_words_with_data(self, node, prefix, results, limit):
        """Helper method to collect words with data"""
        if len(results) >= limit:
            return
        
        if node.is_end_of_word and node.data:
            results.append((prefix, node.frequency, node.data))
        
        for char, child_node in node.children.items():
            self._collect_words_with_data(child_node, prefix + char, results, limit)

class AppointmentPriorityQueue:
    """Min/Max Heap implementation for appointment prioritization"""
    def __init__(self):
        self.heap = []
    
    def calculate_priority(self, appointment_data):
        """Calculate priority score for an appointment"""
        priority_score = 0
        
        # Base priority by appointment type
        appointment_type = appointment_data.get('appointment_type', '').lower()
        if appointment_type == 'emergency':
            priority_score += 50
        elif appointment_type == 'urgent':
            priority_score += 30
        elif appointment_type == 'follow-up':
            priority_score += 15
        
        # Age-based priority (elderly patients get higher priority)
        patient_age = appointment_data.get('patient_age', 0)
        if patient_age >= 65:
            priority_score += 20
        
        # Waiting time priority
        appointment_date = appointment_data.get('appointment_date')
        if appointment_date:
            days_waiting = (datetime.now().date() - appointment_date).days
            priority_score += min(days_waiting * 2, 20)  # Max 20 points for waiting
        
        return priority_score
    
    def add_appointment(self, appointment_id, appointment_data):
        """Add appointment to priority queue"""
        priority = self.calculate_priority(appointment_data)
        # Use negative priority for max heap behavior (highest priority first)
        heapq.heappush(self.heap, (-priority, appointment_id, appointment_data))
    
    def get_next_appointment(self):
        """Get highest priority appointment"""
        if self.heap:
            priority, appointment_id, appointment_data = heapq.heappop(self.heap)
            return appointment_id, appointment_data, -priority
        return None, None, 0
    
    def peek_next_appointment(self):
        """Peek at highest priority appointment without removing"""
        if self.heap:
            priority, appointment_id, appointment_data = self.heap[0]
            return appointment_id, appointment_data, -priority
        return None, None, 0
    
    def update_appointment_priority(self, appointment_id, new_data):
        """Update appointment priority (requires rebuilding heap)"""
        # Remove old entry and add new one
        self.heap = [(p, aid, data) for p, aid, data in self.heap if aid != appointment_id]
        heapq.heapify(self.heap)
        self.add_appointment(appointment_id, new_data)

class DoctorReferralGraph:
    """Graph implementation for doctor referral system"""
    def __init__(self):
        self.graph = defaultdict(list)
        self.doctor_data = {}
        self.specialization_graph = defaultdict(set)
    
    def add_doctor(self, doctor_id, doctor_data):
        """Add doctor to the graph"""
        self.doctor_data[doctor_id] = doctor_data
        specialization = doctor_data.get('specialization', '')
        self.specialization_graph[specialization].add(doctor_id)
    
    def add_referral_relationship(self, from_doctor_id, to_doctor_id, weight=1):
        """Add referral relationship between doctors"""
        self.graph[from_doctor_id].append((to_doctor_id, weight))
    
    def find_specialist_recommendations(self, specialization, current_doctor_id=None, limit=5):
        """Find recommended specialists using BFS"""
        if specialization not in self.specialization_graph:
            return []
        
        specialists = list(self.specialization_graph[specialization])
        
        # If current doctor is provided, prioritize based on referral network
        if current_doctor_id and current_doctor_id in self.graph:
            # Use BFS to find connected specialists
            visited = set()
            queue = deque([(current_doctor_id, 0)])  # (doctor_id, distance)
            recommendations = []
            
            while queue and len(recommendations) < limit:
                doctor_id, distance = queue.popleft()
                
                if doctor_id in visited:
                    continue
                visited.add(doctor_id)
                
                # Check if this doctor is a specialist we're looking for
                if (doctor_id != current_doctor_id and 
                    doctor_id in specialists and 
                    doctor_id in self.doctor_data):
                    doctor_info = self.doctor_data[doctor_id].copy()
                    doctor_info['referral_distance'] = distance
                    recommendations.append((doctor_id, doctor_info))
                
                # Add neighbors to queue
                for neighbor_id, weight in self.graph[doctor_id]:
                    if neighbor_id not in visited:
                        queue.append((neighbor_id, distance + 1))
            
            # Sort by rating and referral distance
            recommendations.sort(key=lambda x: (-x[1].get('rating', 0), x[1]['referral_distance']))
            return recommendations[:limit]
        
        # If no current doctor, return top-rated specialists
        recommendations = []
        for doctor_id in specialists:
            if doctor_id in self.doctor_data:
                recommendations.append((doctor_id, self.doctor_data[doctor_id]))
        
        recommendations.sort(key=lambda x: -x[1].get('rating', 0))
        return recommendations[:limit]
    
    def find_shortest_referral_path(self, from_doctor_id, to_specialization):
        """Find shortest path to a specialist using BFS"""
        if from_doctor_id not in self.graph:
            return []
        
        target_doctors = self.specialization_graph.get(to_specialization, set())
        if not target_doctors:
            return []
        
        visited = set()
        queue = deque([(from_doctor_id, [from_doctor_id])])
        
        while queue:
            current_doctor, path = queue.popleft()
            
            if current_doctor in visited:
                continue
            visited.add(current_doctor)
            
            if current_doctor in target_doctors:
                return path
            
            for neighbor_id, weight in self.graph[current_doctor]:
                if neighbor_id not in visited:
                    queue.append((neighbor_id, path + [neighbor_id]))
        
        return []

class SegmentTree:
    """Segment Tree for range query analytics"""
    def __init__(self, size):
        self.size = size
        self.tree = [0] * (4 * size)
        self.lazy = [0] * (4 * size)
    
    def push(self, node, start, end):
        """Push lazy propagation"""
        if self.lazy[node] != 0:
            self.tree[node] += self.lazy[node] * (end - start + 1)
            if start != end:
                self.lazy[2 * node] += self.lazy[node]
                self.lazy[2 * node + 1] += self.lazy[node]
            self.lazy[node] = 0
    
    def update_range(self, node, start, end, left, right, value):
        """Update range with lazy propagation"""
        self.push(node, start, end)
        if start > right or end < left:
            return
        
        if start >= left and end <= right:
            self.lazy[node] += value
            self.push(node, start, end)
            return
        
        mid = (start + end) // 2
        self.update_range(2 * node, start, mid, left, right, value)
        self.update_range(2 * node + 1, mid + 1, end, left, right, value)
        
        self.push(2 * node, start, mid)
        self.push(2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]
    
    def query_range(self, node, start, end, left, right):
        """Query sum in range"""
        if start > right or end < left:
            return 0
        
        self.push(node, start, end)
        
        if start >= left and end <= right:
            return self.tree[node]
        
        mid = (start + end) // 2
        left_sum = self.query_range(2 * node, start, mid, left, right)
        right_sum = self.query_range(2 * node + 1, mid + 1, end, left, right)
        return left_sum + right_sum
    
    def update(self, left, right, value):
        """Public method to update range"""
        self.update_range(1, 0, self.size - 1, left, right, value)
    
    def query(self, left, right):
        """Public method to query range"""
        return self.query_range(1, 0, self.size - 1, left, right)

class HDIMSDataStructures:
    """Main class that integrates all data structures"""
    def __init__(self):
        self.patient_trie = Trie()
        self.doctor_trie = Trie()
        self.disease_trie = Trie()
        self.appointment_queue = AppointmentPriorityQueue()
        self.referral_graph = DoctorReferralGraph()
        self.metrics_tree = SegmentTree(365)  # For daily metrics over a year
        
        logging.info("HDIMS Data Structures initialized")
    
    def index_patient(self, patient_id, patient_data):
        """Index patient data in Trie"""
        full_name = f"{patient_data.get('first_name', '')} {patient_data.get('last_name', '')}"
        email = patient_data.get('email', '')
        patient_id_str = patient_data.get('patient_id', '')
        
        self.patient_trie.insert(full_name, {'id': patient_id, 'type': 'patient', 'data': patient_data})
        self.patient_trie.insert(email, {'id': patient_id, 'type': 'patient', 'data': patient_data})
        self.patient_trie.insert(patient_id_str, {'id': patient_id, 'type': 'patient', 'data': patient_data})
    
    def index_doctor(self, doctor_id, doctor_data):
        """Index doctor data in Trie and Graph"""
        full_name = f"{doctor_data.get('first_name', '')} {doctor_data.get('last_name', '')}"
        email = doctor_data.get('email', '')
        specialization = doctor_data.get('specialization', '')
        doctor_id_str = doctor_data.get('doctor_id', '')
        
        self.doctor_trie.insert(full_name, {'id': doctor_id, 'type': 'doctor', 'data': doctor_data})
        self.doctor_trie.insert(email, {'id': doctor_id, 'type': 'doctor', 'data': doctor_data})
        self.doctor_trie.insert(specialization, {'id': doctor_id, 'type': 'doctor', 'data': doctor_data})
        self.doctor_trie.insert(doctor_id_str, {'id': doctor_id, 'type': 'doctor', 'data': doctor_data})
        
        self.referral_graph.add_doctor(doctor_id, doctor_data)
    
    def index_disease(self, disease_name, disease_data):
        """Index disease data in Trie"""
        self.disease_trie.insert(disease_name, {'type': 'disease', 'data': disease_data})
        
        # Also index by symptoms and category
        symptoms = disease_data.get('symptoms', '')
        category = disease_data.get('category', '')
        if symptoms:
            self.disease_trie.insert(symptoms, {'type': 'disease', 'data': disease_data})
        if category:
            self.disease_trie.insert(category, {'type': 'disease', 'data': disease_data})
    
    def search_patients(self, query, limit=10):
        """Search patients using Trie"""
        return self.patient_trie.get_suggestions_with_data(query, limit)
    
    def search_doctors(self, query, limit=10):
        """Search doctors using Trie"""
        return self.doctor_trie.get_suggestions_with_data(query, limit)
    
    def search_diseases(self, query, limit=10):
        """Search diseases using Trie"""
        return self.disease_trie.get_suggestions_with_data(query, limit)
