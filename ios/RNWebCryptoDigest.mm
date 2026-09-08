#import <React/RCTBridgeModule.h>
#import <CommonCrypto/CommonDigest.h>
#import <limits.h>

@interface RNWebCryptoDigest : NSObject <RCTBridgeModule>
@end

@implementation RNWebCryptoDigest
RCT_EXPORT_MODULE();
+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_REMAP_METHOD(digest,
                 digestAlgorithm:(NSString *)algorithm
                 bytes:(NSArray<NSNumber *> *)bytes
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (bytes.count > UINT_MAX) {
    reject(@"OperationError", @"Input is too large.", nil);
    return;
  }
  NSMutableData *input = [NSMutableData dataWithLength:bytes.count];
  uint8_t *buffer = (uint8_t *)input.mutableBytes;
  for (NSUInteger i = 0; i < bytes.count; i++) buffer[i] = bytes[i].unsignedCharValue;
  unsigned char output[CC_SHA512_DIGEST_LENGTH];
  NSUInteger length;
  const void *data = input.length ? input.bytes : "";
  CC_LONG size = (CC_LONG)input.length;
  if ([algorithm isEqualToString:@"SHA-1"]) {
    CC_SHA1(data, size, output); length = CC_SHA1_DIGEST_LENGTH;
  } else if ([algorithm isEqualToString:@"SHA-256"]) {
    CC_SHA256(data, size, output); length = CC_SHA256_DIGEST_LENGTH;
  } else if ([algorithm isEqualToString:@"SHA-384"]) {
    CC_SHA384(data, size, output); length = CC_SHA384_DIGEST_LENGTH;
  } else if ([algorithm isEqualToString:@"SHA-512"]) {
    CC_SHA512(data, size, output); length = CC_SHA512_DIGEST_LENGTH;
  } else {
    reject(@"NotSupportedError", @"Unsupported digest algorithm.", nil); return;
  }
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:length];
  for (NSUInteger i = 0; i < length; i++) [result addObject:@(output[i])];
  resolve(result);
}
@end
