#include<bits/stdc++.h>
#define umap unordered_map
using namespace std;

// Node structure for Huffman Tree
struct Node {
    char ch;
    int freq;
    Node *left, *right;
    Node(char character, int frequency) : ch(character), freq(frequency), left(nullptr), right(nullptr) {}
};



// compare function for priority queue
struct compare {
    bool operator()(Node* l, Node* r) {
        return (l->freq > r->freq);
    }
};



// tree serialization

// Left -> 0
// Right -> 1

void serialize(Node *root , string &out) {
    if(!root) return ;
    // Leaf node
    if(!root->left && !root->right) {
        out += '1' ;
        out += root->ch ;
    } else {
        out += '0' ;
        serialize(root->left , out) ;
        serialize(root->right , out) ;
    }
}



Node* deserialize(const string &data , int &index) {
    if(index >= data.size()) return nullptr ;
    if(data[index] == '1') {
        index++ ;
        char c = data[index++] ;
        return new Node(c , 0) ;
    } else {
        index++ ;
        Node *left = deserialize(data , index) ;
        Node *right = deserialize(data , index) ;
        Node *node = new Node('\0' , 0) ;
        node->left = left ;
        node->right = right ;
        return node ;
    }
}


// code Mapping
void buildCodes(Node *root , string str , umap<char , string>& huffCodes) {
    if(!root) return ;
    if(!root->left && !root->right) {
        huffCodes[root->ch] = str ;
    }
    buildCodes(root->left , str + "0" , huffCodes) ;
    buildCodes(root->right , str + "1" , huffCodes) ;
}


// -----------------------Compression------------------------
void compress(string inputFile , string outputFile) {
    ifstream in(inputFile , ios::binary) ;
    string text((istreambuf_iterator<char>(in)), istreambuf_iterator<char>()) ;
    in.close() ;

    if(text.empty()) {
        cerr << "Input file is empty.\n";
        return;
    }

    // frequency cnt
    umap<char , int> freq ;
    for(char ch : text) freq[ch]++ ;

    // build huffman tree
    priority_queue<Node* , vector<Node*> , compare> pq ;
    for(auto& p : freq) pq.push(new Node(p.first , p.second)) ;
    while(pq.size() > 1) {
        Node* l = pq.top() ;
        pq.pop() ;
        Node* r = pq.top() ;
        pq.pop() ;
        Node* node = new Node('\0' , l->freq + r->freq) ;
        node->left = l ;
        node->right = r ;
        pq.push(node) ;
    }

    Node* root = pq.top() ;

    // build codes 
    umap<char , string> huffCodes ;
    buildCodes(root , "" , huffCodes) ;

    // encode text
    string encoded = "" ;
    for(char ch : text) encoded += huffCodes[ch] ;

    // Serialize tree
    string treeData = "";
    serialize(root, treeData);


     // Pack bits into bytes
    string packed = "";
    for (int i = 0; i < encoded.size(); i += 8) {
        string byteStr = encoded.substr(i, 8);
        while (byteStr.size() < 8) byteStr += "0";
        char b = (char) stoi(byteStr, nullptr, 2);
        packed += b;
    }

     // Write file: [tree_size][tree][encoded_size][data]
    ofstream out(outputFile, ios::binary);
    int treeSize = treeData.size();
    int encodedSize = encoded.size();
    out.write((char*)&treeSize, sizeof(treeSize));
    out.write(treeData.c_str(), treeSize);
    out.write((char*)&encodedSize, sizeof(encodedSize));
    out.write(packed.c_str(), packed.size());
    out.close();


    
    cout << "✅ Compression complete!\n";
    cout << "Original size: " << text.size() << " bytes\n";
    cout << "Compressed size: " << packed.size() << " bytes\n";
    cout << "Compression ratio: " 
         << (100.0 * (text.size() - packed.size()) / text.size()) << "%\n";
}

// ---------------------- Decompression ----------------------
void decompress(string inputFile, string outputFile) {
    ifstream in(inputFile, ios::binary);
    if (!in) {
        cerr << "Error opening file!\n";
        return;
    }

    int treeSize;
    in.read((char*)&treeSize, sizeof(treeSize));
    string treeData(treeSize, '\0');
    in.read(&treeData[0], treeSize);

    int encodedSize;
    in.read((char*)&encodedSize, sizeof(encodedSize));

    string packed((istreambuf_iterator<char>(in)), istreambuf_iterator<char>());
    in.close();

    // Rebuild Huffman tree
    int index = 0;
    Node* root = deserialize(treeData, index);

    // Unpack bits
    string encoded = "";
    for (char c : packed) {
        bitset<8> b(c);
        encoded += b.to_string();
    }
    encoded = encoded.substr(0, encodedSize);

    // Decode
    string decoded = "";
    Node* curr = root;
    for (char bit : encoded) {
        if (bit == '0') curr = curr->left;
        else curr = curr->right;
        if (!curr->left && !curr->right) {
            decoded += curr->ch;
            curr = root;
        }
    }

    ofstream out(outputFile, ios::binary);
    out << decoded;
    out.close();

    cout << "✅ Decompression complete!\n";
    cout << "Recovered size: " << decoded.size() << " bytes\n";
}



int main(int argc, char* argv[]) {
    if (argc < 4) {
        cerr << "Usage: ./huffman <compress/decompress> <input> <output>\n";
        return 1;
    }
    string mode = argv[1];
    if (mode == "compress") {
        compress(argv[2], argv[3]);
    } else if (mode == "decompress") {
        decompress(argv[2], argv[3]);
    } else {
        cerr << "Invalid mode. Use compress/decompress\n";
        return 1;
    }
    return 0;
}