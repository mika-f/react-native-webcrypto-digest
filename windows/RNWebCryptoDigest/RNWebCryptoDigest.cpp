#include "pch.h"
#include "RNWebCryptoDigest.h"

#include <cmath>
#include <limits>
#include <winrt/Windows.Security.Cryptography.h>
#include <winrt/Windows.Security.Cryptography.Core.h>
#include <winrt/Windows.Storage.Streams.h>

namespace RNWebCryptoDigest {

void WebCryptoDigest::Digest(
    std::string const &algorithm,
    std::vector<double> const &bytes,
    winrt::Microsoft::ReactNative::ReactPromise<std::vector<int64_t>> const &promise) noexcept {
  using namespace winrt::Microsoft::ReactNative;
  using namespace winrt::Windows::Security::Cryptography;
  using namespace winrt::Windows::Security::Cryptography::Core;

  try {
    winrt::hstring name;
    if (algorithm == "SHA-1") {
      name = HashAlgorithmNames::Sha1();
    } else if (algorithm == "SHA-256") {
      name = HashAlgorithmNames::Sha256();
    } else if (algorithm == "SHA-384") {
      name = HashAlgorithmNames::Sha384();
    } else if (algorithm == "SHA-512") {
      name = HashAlgorithmNames::Sha512();
    } else {
      promise.Reject(ReactError{"NotSupportedError", "Unsupported digest algorithm.", {}});
      return;
    }

    if (bytes.size() > (std::numeric_limits<uint32_t>::max)()) {
      promise.Reject(ReactError{"OperationError", "Input is too large.", {}});
      return;
    }

    std::vector<uint8_t> input;
    input.reserve(bytes.size());
    for (double byte : bytes) {
      if (!std::isfinite(byte) || byte < 0 || byte > 255 || std::trunc(byte) != byte) {
        promise.Reject(ReactError{"OperationError", "Input must contain integer bytes from 0 to 255.", {}});
        return;
      }
      input.push_back(static_cast<uint8_t>(byte));
    }

    auto provider = HashAlgorithmProvider::OpenAlgorithm(name);
    auto buffer = CryptographicBuffer::CreateFromByteArray(input);
    auto hash = provider.HashData(buffer);
    winrt::com_array<uint8_t> output;
    CryptographicBuffer::CopyToByteArray(hash, output);
    promise.Resolve(std::vector<int64_t>(output.begin(), output.end()));
  } catch (winrt::hresult_error const &error) {
    promise.Reject(ReactError{"OperationError", winrt::to_string(error.message()), {}});
  } catch (std::exception const &error) {
    promise.Reject(ReactError{"OperationError", error.what(), {}});
  } catch (...) {
    promise.Reject(ReactError{"OperationError", "Digest operation failed.", {}});
  }
}

}
