import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/kyc_service.dart';
import '../../services/storage_service.dart';
import '../../theme/app_colors.dart';

class KycScreen extends StatefulWidget {
  const KycScreen({super.key});

  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  final _kycService = KycService();
  final _storageService = StorageService();
  final _picker = ImagePicker();

  String _idType = 'national_id';
  File? _idFront;
  File? _idBack;
  File? _selfie;

  bool _isLoading = false;
  String _currentStatus = 'none';
  Map<String, dynamic>? _verificationData;

  @override
  void initState() {
    super.initState();
    _loadKycData();
  }

  Future<void> _loadKycData() async {
    setState(() => _isLoading = true);
    try {
      final status = await _kycService.getKycStatus();
      final data = await _kycService.getKycVerification();
      setState(() {
        _currentStatus = status;
        _verificationData = data;
        if (data != null) {
          _idType = data['id_type'];
        }
      });
    } catch (e) {
      debugPrint('Error loading KYC data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickImage(String type) async {
    if (_currentStatus == 'pending' || _currentStatus == 'verified') return;

    final pickedFile = await _picker.pickImage(
      source: type == 'selfie' ? ImageSource.camera : ImageSource.gallery,
      imageQuality: 70,
    );

    if (pickedFile != null) {
      setState(() {
        if (type == 'front') _idFront = File(pickedFile.path);
        if (type == 'back') _idBack = File(pickedFile.path);
        if (type == 'selfie') _selfie = File(pickedFile.path);
      });
    }
  }

  Future<void> _submit() async {
    if (_idFront == null || _selfie == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload ID Front and Selfie')),
      );
      return;
    }

    if (_idType != 'passport' && _idBack == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload ID Back')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final frontUrl =
          await _storageService.uploadKycDoc(_idFront!, 'id_front');
      String? backUrl;
      if (_idBack != null) {
        backUrl = await _storageService.uploadKycDoc(_idBack!, 'id_back');
      }
      final selfieUrl = await _storageService.uploadKycDoc(_selfie!, 'selfie');

      await _kycService.submitKyc(
        idType: _idType,
        idFrontUrl: frontUrl,
        idBackUrl: backUrl,
        selfieUrl: selfieUrl,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('KYC submitted successfully!')),
        );
        _loadKycData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Identity Verification (KYC)')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatusHeader(),
                  const SizedBox(height: 24),
                  if (_currentStatus == 'none' ||
                      _currentStatus == 'rejected') ...[
                    const Text('Select ID Type',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _idType,
                      items: const [
                        DropdownMenuItem(
                            value: 'national_id', child: Text('National ID')),
                        DropdownMenuItem(
                            value: 'passport', child: Text('Passport')),
                        DropdownMenuItem(
                            value: 'drivers_license',
                            child: Text('Driver\'s License')),
                      ],
                      onChanged: (val) => setState(() => _idType = val!),
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    _buildUploadSection('ID Front', 'front', _idFront),
                    if (_idType != 'passport') ...[
                      const SizedBox(height: 16),
                      _buildUploadSection('ID Back', 'back', _idBack),
                    ],
                    const SizedBox(height: 16),
                    _buildUploadSection('Selfie with ID', 'selfie', _selfie),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.emerald,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 55),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Submit for Review',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Your personal information is secure and will only be used for verification purposes.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ] else ...[
                    _buildReviewState(),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildStatusHeader() {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (_currentStatus) {
      case 'pending':
        statusColor = Colors.orange;
        statusIcon = Icons.hourglass_empty;
        statusText = 'Verification Pending';
        break;
      case 'verified':
        statusColor = AppColors.emerald;
        statusIcon = Icons.verified;
        statusText = 'Account Verified';
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusIcon = Icons.error_outline;
        statusText = 'Verification Rejected';
        break;
      default:
        statusColor = Colors.blue;
        statusIcon = Icons.info_outline;
        statusText = 'Not Verified';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor),
      ),
      child: Row(
        children: [
          Icon(statusIcon, color: statusColor),
          const SizedBox(width: 12),
          Text(
            statusText,
            style: TextStyle(
                color: statusColor, fontWeight: FontWeight.bold, fontSize: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadSection(String label, String type, File? file) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _pickImage(type),
          child: Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(12),
              color: Colors.grey[50],
            ),
            child: file != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(file, fit: BoxFit.cover),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                          type == 'selfie'
                              ? Icons.camera_alt
                              : Icons.upload_file,
                          color: Colors.grey,
                          size: 40),
                      const SizedBox(height: 8),
                      Text(type == 'selfie' ? 'Take a Selfie' : 'Upload Image',
                          style: const TextStyle(color: Colors.grey)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewState() {
    return Column(
      children: [
        const SizedBox(height: 20),
        const Text(
          'Thank you for submitting your identity documents. Our team is currently reviewing your information.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16),
        ),
        const SizedBox(height: 40),
        const Icon(Icons.security, size: 80, color: Colors.grey),
        if (_currentStatus == 'rejected' &&
            _verificationData?['rejection_reason'] != null) ...[
          const SizedBox(height: 24),
          Text(
            'Reason: ${_verificationData!['rejection_reason']}',
            style:
                const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
          ),
        ],
      ],
    );
  }
}
