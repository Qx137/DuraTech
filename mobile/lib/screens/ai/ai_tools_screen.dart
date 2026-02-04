import 'package:flutter/material.dart';
import '../../services/ai_service.dart';
import '../../theme/app_colors.dart';

class AIToolsScreen extends StatefulWidget {
  const AIToolsScreen({super.key});

  @override
  State<AIToolsScreen> createState() => _AIToolsScreenState();
}

class _AIToolsScreenState extends State<AIToolsScreen> {
  final _aiService = AIService();
  String _selectedTool = 'recommendations';
  bool _isLoading = false;

  final _locationController = TextEditingController();
  String _selectedSeason = 'Spring';
  String _selectedSoil = 'Clay';

  final _cropController = TextEditingController();
  String _selectedPeriod = '3 Months';

  List<Map<String, dynamic>> _recommendations = [];
  Map<String, dynamic>? _priceAnalysis;

  Future<void> _generateRecommendations() async {
    if (_locationController.text.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final results = await _aiService.generateCropRecommendations(
        location: _locationController.text,
        season: _selectedSeason,
        soilType: _selectedSoil,
      );
      setState(() => _recommendations = results);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _analyzePricing() async {
    if (_cropController.text.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final results = await _aiService.analyzePriceTrends(
        crop: _cropController.text,
        period: _selectedPeriod,
      );
      setState(() => _priceAnalysis = results);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'AI Agricultural Tools',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildToolSelector(),
            const SizedBox(height: 24),
            if (_selectedTool == 'recommendations') _buildRecommendationForm(),
            if (_selectedTool == 'pricing') _buildPricingForm(),
            const SizedBox(height: 24),
            if (_isLoading) const Center(child: CircularProgressIndicator()),
            if (!_isLoading &&
                _selectedTool == 'recommendations' &&
                _recommendations.isNotEmpty)
              _buildResultsList(),
            if (!_isLoading &&
                _selectedTool == 'pricing' &&
                _priceAnalysis != null)
              _buildPriceAnalysisResult(),
          ],
        ),
      ),
    );
  }

  Widget _buildToolSelector() {
    return Row(
      children: [
        _toolTab('recommendations', 'Crops', Icons.eco),
        const SizedBox(width: 8),
        _toolTab('pricing', 'Pricing', Icons.trending_up),
      ],
    );
  }

  Widget _toolTab(String key, String label, IconData icon) {
    final isSelected = _selectedTool == key;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedTool = key),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.emerald : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.emerald : Colors.grey[300]!,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.white : Colors.grey),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecommendationForm() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: 'Location',
                prefixIcon: Icon(Icons.location_on),
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedSeason,
              decoration: const InputDecoration(labelText: 'Season'),
              items: [
                'Spring',
                'Summer',
                'Fall',
                'Winter',
              ].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
              onChanged: (v) => setState(() => _selectedSeason = v!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedSoil,
              decoration: const InputDecoration(labelText: 'Soil Type'),
              items: [
                'Clay',
                'Sandy',
                'Loam',
                'Silt',
              ].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
              onChanged: (v) => setState(() => _selectedSoil = v!),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _generateRecommendations,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.emerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('Generate Recommendations'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'AI Recommendations',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ..._recommendations.map(
          (rec) => Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(
                rec['crop'],
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(rec['reason']),
              trailing: Chip(
                label: Text('${rec['confidence']}%'),
                backgroundColor: AppColors.emerald.withOpacity(0.1),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPricingForm() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.grey[200]!)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _cropController,
              decoration: const InputDecoration(
                  labelText: 'Crop Name', prefixIcon: Icon(Icons.abc)),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedPeriod,
              decoration: const InputDecoration(labelText: 'Analysis Period'),
              items: ['1 Month', '3 Months', '6 Months', '1 Year']
                  .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                  .toList(),
              onChanged: (v) => setState(() => _selectedPeriod = v!),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _analyzePricing,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.emerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('Analyze Market Trends'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceAnalysisResult() {
    if (_priceAnalysis == null) return const SizedBox.shrink();

    final factors = List<String>.from(_priceAnalysis!['factors'] ?? []);
    final trend =
        _priceAnalysis!['trend']?.toString().toLowerCase() ?? 'stable';
    final trendIcon = trend == 'increasing'
        ? Icons.trending_up
        : trend == 'decreasing'
            ? Icons.trending_down
            : Icons.trending_flat;
    final trendColor = trend == 'increasing'
        ? Colors.green
        : trend == 'decreasing'
            ? Colors.red
            : Colors.blue;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Price Trend Analysis',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Current Price',
                            style: TextStyle(color: Colors.grey)),
                        Text(_priceAnalysis!['current'].toString(),
                            style: const TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Icon(trendIcon, color: trendColor, size: 40),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('Predicted Price',
                            style: TextStyle(color: Colors.grey)),
                        Text(_priceAnalysis!['prediction'].toString(),
                            style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: trendColor)),
                      ],
                    ),
                  ],
                ),
                const Divider(height: 32),
                Row(
                  children: [
                    const Icon(Icons.info_outline,
                        size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Text('Confidence Level: ${_priceAnalysis!['confidence']}%'),
                  ],
                ),
                const SizedBox(height: 16),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Key Influencing Factors:',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 8),
                ...factors.map((f) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_outline,
                              size: 14, color: AppColors.emerald),
                          const SizedBox(width: 8),
                          Expanded(child: Text(f)),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _locationController.dispose();
    _cropController.dispose();
    super.dispose();
  }
}
