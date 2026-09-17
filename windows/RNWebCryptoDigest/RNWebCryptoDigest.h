#pragma once

#include <NativeModules.h>
#include <cstdint>
#include <string>
#include <vector>

namespace RNWebCryptoDigest {

REACT_MODULE(WebCryptoDigest, L"RNWebCryptoDigest")
struct WebCryptoDigest {
  REACT_METHOD(Digest, L"digest")
  void Digest(
      std::string const &algorithm,
      std::vector<double> const &bytes,
      winrt::Microsoft::ReactNative::ReactPromise<std::vector<int64_t>> const &promise) noexcept;
};

}
