#ifndef HDIMS_TRIE_H
#define HDIMS_TRIE_H

#include <string>
#include <unordered_map>
#include <vector>
#include <memory>
#include <algorithm>

namespace hdims {

// Template Trie implementation for fast search functionality
template <typename T>
class Trie {
private:
    struct TrieNode {
        std::unordered_map<char, std::shared_ptr<TrieNode>> children;
        bool isEndOfWord;
        std::vector<T> data; // Store data associated with this node

        TrieNode() : isEndOfWord(false) {}
    };

    std::shared_ptr<TrieNode> root;

public:
    Trie() : root(std::make_shared<TrieNode>()) {}

    // Insert a word and associated data into the trie
    void insert(const std::string& word, const T& itemData) {
        auto current = root;
        
        for (char c : word) {
            // Convert to lowercase for case-insensitive search
            char lowerC = std::tolower(c);
            
            if (current->children.find(lowerC) == current->children.end()) {
                current->children[lowerC] = std::make_shared<TrieNode>();
            }
            current = current->children[lowerC];
        }
        
        current->isEndOfWord = true;
        current->data.push_back(itemData);
    }

    // Search for data associated with an exact word
    std::vector<T> search(const std::string& word) const {
        auto current = root;
        
        for (char c : word) {
            // Convert to lowercase for case-insensitive search
            char lowerC = std::tolower(c);
            
            if (current->children.find(lowerC) == current->children.end()) {
                return {}; // Word not found
            }
            current = current->children[lowerC];
        }
        
        return current->isEndOfWord ? current->data : std::vector<T>{};
    }

    // Get all data items with a given prefix (autocomplete functionality)
    std::vector<T> autocomplete(const std::string& prefix) const {
        auto current = root;
        std::vector<T> results;
        
        // Navigate to the node corresponding to the prefix
        for (char c : prefix) {
            // Convert to lowercase for case-insensitive search
            char lowerC = std::tolower(c);
            
            if (current->children.find(lowerC) == current->children.end()) {
                return {}; // Prefix not found
            }
            current = current->children[lowerC];
        }
        
        // Collect all data items from this node and its children
        collectAllData(current, results);
        return results;
    }

private:
    // Helper function to collect all data from a node and its children
    void collectAllData(std::shared_ptr<TrieNode> node, std::vector<T>& results) const {
        if (!node) return;
        
        if (node->isEndOfWord) {
            // Add all data from this node
            results.insert(results.end(), node->data.begin(), node->data.end());
        }
        
        // Recursively collect data from all children
        for (const auto& pair : node->children) {
            collectAllData(pair.second, results);
        }
    }
};

// Define the patient information structure
struct PatientInfo {
    std::string id;
    std::string name;
    std::string email;
    std::string phone;
    
    // Convert to JSON for API responses
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["id"] = id;
        j["name"] = name;
        j["email"] = email;
        j["phone"] = phone;
        return j;
    }
};

// Define the disease information structure
struct DiseaseInfo {
    std::string name;
    std::string description;
    std::string symptoms;
    std::string treatments;
    
    // Convert to JSON for API responses
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["name"] = name;
        j["description"] = description;
        j["symptoms"] = symptoms;
        j["treatments"] = treatments;
        return j;
    }
};

// Specializations of Trie for patients and diseases
using PatientTrie = Trie<PatientInfo>;
using DiseaseTrie = Trie<DiseaseInfo>;

} // namespace hdims

#endif // HDIMS_TRIE_H