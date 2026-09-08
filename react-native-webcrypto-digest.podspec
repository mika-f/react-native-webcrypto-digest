require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
Pod::Spec.new do |s|
  s.name = 'react-native-webcrypto-digest'
  s.version = package['version']
  s.summary = package['description']
  s.homepage = 'https://github.com/mika-f/react-native-webcrypto-digest'
  s.author = 'Kanon Mochizuki'
  s.license = { :type => 'MIT' }
  s.source = { :git => 'https://github.com/mika-f/react-native-webcrypto-digest.git', :tag => s.version.to_s }
  s.platforms = { :ios => '13.4' }
  s.source_files = 'ios/**/*.{h,m,mm}'
  s.dependency 'React-Core'
end
