#include <iostream>
#include <string>
#include <unordered_map>
#include <queue>
#include <vector>
#include <bitset>
#include <cstdlib>
#include <cstring>

#define umap unordered_map
using namespace std;


// Node structure for Huffman Tree
struct Node {
    char ch;
    int freq;
    Node *left, *right;
    Node(char character, int frequency) : ch(character), freq(frequency), left(nullptr), right(nullptr) {}
};

// Compare function for priority queue
struct compare {
    bool operator()(Node* l, Node* r) {
        return (l->freq > r->freq);
    }
};

// Serialize Huffman Tree
void serialize(Node *root, string &out) {
    if (!root) return;
    if (!root->left && !root->right) {
        out += '1';
        out += root->ch;
    } else {
        out += '0';
        serialize(root->left, out);
        serialize(root->right, out);
    }
}

// Deserialize Huffman Tree
Node* deserialize(const string &data, int &index) {
    if (index >= data.size()) return nullptr;
    if (data[index] == '1') {
        index++;
        char c = data[index++];
        return new Node(c, 0);
    } else {
        index++;
        Node *left = deserialize(data, index);
        Node *right = deserialize(data, index);
        Node *node = new Node('\0', 0);
        node->left = left;
        node->right = right;
        return node;
    }
}

// Build Huffman codes
void buildCodes(Node *root, string str, umap<char, string>& huffCodes) {
    if (!root) return;
    if (!root->left && !root->right) {
        huffCodes[root->ch] = str;
    }
    buildCodes(root->left, str + "0", huffCodes);
    buildCodes(root->right, str + "1", huffCodes);
}

// ----------------- WASM EXPORTS -----------------
extern "C" {
    
    // Global storage for compressed/decompressed data
    static char* result_buffer = nullptr;
    static size_t result_size = 0;

    // Free previously allocated result buffer
    void freeResult() {
        if (result_buffer) {
            free(result_buffer);
            result_buffer = nullptr;
            result_size = 0;
        }
    }

    // Get the size of the last result
    size_t getResultSize() {
        return result_size;
    }

    // Compress binary data
    int compress(const char* input, size_t inputSize, char* output) {
        if (!input || inputSize == 0) return -1;

        string text(input, inputSize);
        
        // Frequency count
        umap<char,int> freq;
        for (char ch : text) freq[ch]++;

        // Handle single character case
        if (freq.size() == 1) {
            // For single character, just store character and count
            string result = "SINGLE:" + string(1, freq.begin()->first) + ":" + to_string(inputSize);
            if (result.size() > inputSize) return -1; // Safety check
            memcpy(output, result.c_str(), result.size());
            return result.size();
        }

        // Build Huffman tree
        priority_queue<Node*, vector<Node*>, compare> pq;
        for (auto &p : freq) pq.push(new Node(p.first, p.second));
        while (pq.size() > 1) {
            Node* l = pq.top(); pq.pop();
            Node* r = pq.top(); pq.pop();
            Node* node = new Node('\0', l->freq + r->freq);
            node->left = l;
            node->right = r;
            pq.push(node);
        }
        Node* root = pq.top();

        // Build codes
        umap<char,string> huffCodes;
        buildCodes(root, "", huffCodes);

        // Encode text
        string encoded = "";
        for (char ch : text) encoded += huffCodes[ch];

        // Serialize tree
        string treeData = "";
        serialize(root, treeData);

        // Pack bits into bytes
        string packed = "";
        for (size_t i = 0; i < encoded.size(); i += 8) {
            string byteStr = encoded.substr(i, 8);
            while (byteStr.size() < 8) byteStr += "0";
            char b = (char) stoi(byteStr, nullptr, 2);
            packed += b;
        }

        // Create final compressed data: [tree_size][tree_data][packed_data]
        string treeSizeStr = to_string(treeData.size()) + "|";
        string finalStr = treeSizeStr + treeData + packed;

        if (finalStr.size() > inputSize * 2) return -1; // Safety check
        memcpy(output, finalStr.c_str(), finalStr.size());
        return finalStr.size();
    }

    // Decompress binary data  
    int decompress(const char* input, size_t inputSize, char* output) {
        if (!input || inputSize == 0) return -1;

        string inStr(input, inputSize);
        
        // Check for single character case
        if (inStr.substr(0, 7) == "SINGLE:") {
            size_t firstColon = inStr.find(':', 7);
            size_t secondColon = inStr.find(':', firstColon + 1);
            if (firstColon == string::npos || secondColon == string::npos) return -1;
            
            char ch = inStr[firstColon + 1];
            size_t count = stoul(inStr.substr(secondColon + 1));
            
            if (count > inputSize * 4) return -1; // Safety check
            memset(output, ch, count);
            return count;
        }

        // Normal Huffman decompression
        size_t sep = inStr.find('|');
        if (sep == string::npos) return -1;

        size_t treeSize = stoul(inStr.substr(0, sep));
        if (sep + 1 + treeSize >= inStr.size()) return -1;

        string treeData = inStr.substr(sep + 1, treeSize);
        string packed = inStr.substr(sep + 1 + treeSize);

        // Rebuild Huffman tree
        int index = 0;
        Node* root = deserialize(treeData, index);
        if (!root) return -1;

        // Unpack bits
        string encoded = "";
        for (char c : packed) {
            bitset<8> b(c);
            encoded += b.to_string();
        }

        // Decode
        string decoded = "";
        Node* curr = root;
        for (char bit : encoded) {
            if (bit == '0') curr = curr->left;
            else curr = curr->right;
            
            if (!curr) return -1; // Invalid tree traversal
            
            if (!curr->left && !curr->right) {
                decoded += curr->ch;
                curr = root;
            }
        }

        if (decoded.size() > inputSize * 4) return -1; // Safety check
        memcpy(output, decoded.c_str(), decoded.size());
        return decoded.size();
    }

    // Legacy string functions for backward compatibility
    const char* compressString(const char* input) {
        freeResult();
        size_t len = strlen(input);
        result_buffer = (char*)malloc(len * 2);
        int compressed_size = compress(input, len, result_buffer);
        if (compressed_size < 0) {
            freeResult();
            return nullptr;
        }
        result_size = compressed_size;
        return result_buffer;
    }

    const char* decompressString(const char* input) {
        freeResult();
        size_t len = strlen(input);
        result_buffer = (char*)malloc(len * 4);
        int decompressed_size = decompress(input, len, result_buffer);
        if (decompressed_size < 0) {
            freeResult();
            return nullptr;
        }
        result_size = decompressed_size;
        result_buffer[decompressed_size] = '\0'; // Null terminate for string
        return result_buffer;
    }

}
