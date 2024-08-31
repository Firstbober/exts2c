#pragma once

template<typename T = const char *>
class string {
    T d;
    public:
    string(T data) {
        this->d = data;
    }
};
