import 'dart:convert';
import 'package:google_generative_ai/google_generative_ai.dart';

class AIService {
  // Try to get key from environment if available
  static const String _defaultApiKey =
      String.fromEnvironment('GEMINI_API_KEY', defaultValue: '');

  late final GenerativeModel _model;

  AIService({String? customKey}) {
    final key = (customKey != null && customKey.isNotEmpty)
        ? customKey
        : _defaultApiKey;
    _model = GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: key,
    );
  }

  Future<String> chat(String message) async {
    final session = _model.startChat();
    final response = await session.sendMessage(Content.text(message));
    return response.text ?? 'No response from AI.';
  }

  Future<List<Map<String, dynamic>>> generateCropRecommendations({
    required String location,
    required String season,
    required String soilType,
  }) async {
    final prompt =
        'Act as an agricultural expert. Suggest 4 crops suitable for farming in $location during $season season with $soilType soil. '
        'Return the response ONLY as a JSON array with the following structure: '
        '[{"crop": "Crop Name", "confidence": 85, "reason": "Brief reason why", "price": "Estimated price per unit"}] '
        'Do not include markdown formatting or code blocks. Just the raw JSON string.';

    final content = [Content.text(prompt)];
    final response = await _model.generateContent(content);

    final text = response.text ?? '[]';
    final cleanText =
        text.replaceAll('```json', '').replaceAll('```', '').trim();
    return List<Map<String, dynamic>>.from(jsonDecode(cleanText));
  }

  Future<Map<String, dynamic>> analyzePriceTrends({
    required String crop,
    required String period,
  }) async {
    final prompt =
        'Act as an agricultural economist. Analyze price trends for $crop over the next $period. '
        'Return the response ONLY as a JSON object with the following structure: '
        '{"current": "Current price", "prediction": "Predicted price", "trend": "increasing", "confidence": 85, "factors": ["Factor 1"]}'
        'Do not include markdown formatting or code blocks. Just the raw JSON string.';

    final content = [Content.text(prompt)];
    final response = await _model.generateContent(content);

    final text = response.text ?? '{}';
    final cleanText =
        text.replaceAll('```json', '').replaceAll('```', '').trim();
    return Map<String, dynamic>.from(jsonDecode(cleanText));
  }

  Future<String> smartSearch(String query) async {
    final prompt =
        'Act as a smart search assistant for an agricultural marketplace. '
        'The user is searching for: "$query". '
        'Suggest 3 categories or types of products they should look for, and explain why. '
        'Keep it brief and helpful.';

    final content = [Content.text(prompt)];
    final response = await _model.generateContent(content);
    return response.text ?? 'No suggestions found.';
  }
}
