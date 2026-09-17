#include "pch.h"
#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif

#include "RNWebCryptoDigest.h"

namespace winrt::RNWebCryptoDigest::implementation {

void ReactPackageProvider::CreatePackage(Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder) noexcept {
#ifdef RNW_NEW_ARCH
  Microsoft::ReactNative::AddAttributedModules(packageBuilder, true);
#else
  Microsoft::ReactNative::AddAttributedModules(packageBuilder);
#endif
}

}
