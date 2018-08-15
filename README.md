# wavenet-audiobook
Convert text to an audiobook via [WaveNet](https://cloud.google.com/text-to-speech/)

![](https://img.shields.io/badge/License-MIT-blue.svg)
![](https://travis-ci.org/TSedlar/wavenet-audiobook.svg)

Example setup:

![](https://i.imgur.com/OZO6lcG.png)

Example of config.json:

```json
{
  "voice_lang": "en-US",
  "voice_name": "en-US-Wavenet-C",
  "voice_rate": "1.15",
  "voice_pitch": "1.60"
}
```

The config.json file can be in one of two place:
- The inner directory along with the txt files
- The parent directory to be used for each individual volume