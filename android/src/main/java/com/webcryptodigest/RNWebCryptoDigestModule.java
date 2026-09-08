package com.webcryptodigest;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import java.security.MessageDigest;

public class RNWebCryptoDigestModule extends ReactContextBaseJavaModule {
  RNWebCryptoDigestModule(ReactApplicationContext context) { super(context); }

  @Override public String getName() { return "RNWebCryptoDigest"; }

  @ReactMethod
  public void digest(String algorithm, ReadableArray bytes, Promise promise) {
    if (!algorithm.equals("SHA-1") && !algorithm.equals("SHA-256")
        && !algorithm.equals("SHA-384") && !algorithm.equals("SHA-512")) {
      promise.reject("NotSupportedError", "Unsupported digest algorithm.");
      return;
    }
    try {
      byte[] input = new byte[bytes.size()];
      for (int i = 0; i < input.length; i++) input[i] = (byte) bytes.getInt(i);
      byte[] output = MessageDigest.getInstance(algorithm).digest(input);
      WritableArray result = Arguments.createArray();
      for (byte value : output) result.pushInt(value & 0xff);
      promise.resolve(result);
    } catch (Exception error) {
      promise.reject("OperationError", "Could not compute digest.", error);
    }
  }
}
