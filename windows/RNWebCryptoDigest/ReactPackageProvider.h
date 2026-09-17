#pragma once

#include "ReactPackageProvider.g.h"

namespace winrt::RNWebCryptoDigest::implementation {

struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider> {
  ReactPackageProvider() = default;

  void CreatePackage(Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder) noexcept;
};

}

namespace winrt::RNWebCryptoDigest::factory_implementation {

struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider, implementation::ReactPackageProvider> {};

}
