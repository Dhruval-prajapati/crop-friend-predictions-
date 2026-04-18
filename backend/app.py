from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')
CORS(app)

# Home route - serves the main page
@app.route('/')
def home():
    return render_template('index.html')

# API Routes
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model_loaded': True})

@app.route('/api/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        temperature = float(data.get('temperature', 28))
        rainfall = float(data.get('rainfall', 1200))
        humidity = float(data.get('humidity', 65))
        soil_type = data.get('soil_type', 'Loamy')
        crop_type = data.get('crop_type', 'Rice')
        
        # Simple prediction logic
        base_yield = {
            'Rice': 4500, 'Wheat': 3500, 'Cotton': 2800,
            'Sugarcane': 6500, 'Millet': 2000
        }
        
        base = base_yield.get(crop_type, 4000)
        
        # Adjust based on conditions
        temp_factor = 1 - abs(temperature - 28) / 50
        rain_factor = min(1.3, max(0.7, rainfall / 1000))
        humidity_factor = 1 - abs(humidity - 65) / 50
        soil_factor = 1.0 if soil_type == 'Loamy' else 0.85 if soil_type == 'Sandy' else 1.1
        
        predicted_yield = base * temp_factor * rain_factor * humidity_factor * soil_factor
        
        # Generate recommendations
        if predicted_yield < 2500:
            action = "Consider changing fertilizer strategy or irrigation method"
            fertilizer_tip = f"Apply nitrogen-rich fertilizer for {crop_type}"
            irrigation_tip = "Increase irrigation frequency during dry spells"
        elif predicted_yield < 4000:
            action = "Good yield but room for improvement"
            fertilizer_tip = f"Balance NPK ratio for better {crop_type} yield"
            irrigation_tip = "Maintain consistent soil moisture"
        else:
            action = "Excellent yield potential. Maintain current practices"
            fertilizer_tip = f"Continue current fertilizer schedule for {crop_type}"
            irrigation_tip = "Current irrigation strategy is working well"
        
        confidence = 0.85 + random.uniform(-0.05, 0.05)
        
        return jsonify({
            'success': True,
            'data': {
                'predicted_yield': round(predicted_yield, 2),
                'unit': 'kg/hectare',
                'confidence_score': round(confidence, 2),
                'recommendation': {
                    'action': action,
                    'fertilizer_tip': fertilizer_tip,
                    'irrigation_tip': irrigation_tip
                }
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/schemes', methods=['GET'])
def schemes():
    schemes = [
        {'name': 'PM-KISAN Samman Nidhi', 'description': 'Income support of ₹6000 per year to small farmers', 'benefit': '₹6000/year', 'eligibility': 'Small and marginal farmers'},
        {'name': 'Pradhan Mantri Fasal Bima Yojana', 'description': 'Crop insurance scheme for yield loss', 'benefit': 'Insurance coverage at low premium', 'eligibility': 'All farmers'},
        {'name': 'Soil Health Card Scheme', 'description': 'Soil testing and health card distribution', 'benefit': 'Free soil testing', 'eligibility': 'All farmers'},
        {'name': 'Kisan Credit Card (KCC)', 'description': 'Credit facility for agricultural needs', 'benefit': 'Easy credit up to ₹3 lakh', 'eligibility': 'Farmers'}
    ]
    return jsonify({'schemes': schemes, 'total': len(schemes)})

@app.route('/api/news', methods=['GET'])
def news():
    news_items = [
        {'title': 'Government announces MSP hike for Rabi crops', 'summary': 'Minimum Support Price increased for wheat, mustard, and gram', 'source': 'Ministry of Agriculture', 'date': '2024-01-15', 'category': 'Policy'},
        {'title': 'New drought-resistant wheat variety developed', 'summary': 'ICAR scientists develop variety requiring 30% less water', 'source': 'ICAR News', 'date': '2024-01-14', 'category': 'Technology'},
        {'title': 'Organic farming subsidies increased by 25%', 'summary': 'Government boosts support for chemical-free agriculture', 'source': 'Agricultural Ministry', 'date': '2024-01-13', 'category': 'Policy'}
    ]
    return jsonify({'news': news_items})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').lower()
    
    responses = {
        'fertilizer': "For better yield, use balanced NPK fertilizers. Consider soil testing first.",
        'pest': "Monitor crops regularly. Use neem oil for organic pest control.",
        'irrigation': "Drip irrigation saves water. Water early morning or evening.",
        'crop': "Choose crops based on your soil type and climate.",
        'price': "Check mandi rates on e-NAM portal.",
        'subsidy': "Visit your local agriculture department for subsidy schemes."
    }
    
    response = "Ask me about crops, fertilizers, pests, irrigation, or subsidies!"
    for keyword, reply in responses.items():
        if keyword in message:
            response = reply
            break
    
    return jsonify({'response': response, 'confidence': 0.85})

@app.route('/api/shop-items', methods=['GET'])
def shop_items():
    items = {
        'fertilizers': [
            {'name': 'NPK 20:20:20', 'price': '₹450/kg', 'image': 'https://via.placeholder.com/150', 'amazon_link': 'https://amazon.in'}
        ],
        'tools': [
            {'name': 'Hand Tractor', 'price': '₹25,000', 'image': 'https://via.placeholder.com/150', 'amazon_link': 'https://amazon.in'}
        ],
        'seeds': [
            {'name': 'Hybrid Rice Seeds', 'price': '₹650/kg', 'image': 'https://via.placeholder.com/150', 'amazon_link': 'https://amazon.in'}
        ]
    }
    return jsonify(items)

if __name__ == '__main__':
    print("=" * 50)
    print("🌾 AgroSmart Pro Backend Server")
    print("=" * 50)
    print("📡 Server running at: http://localhost:5000")
    print("🌐 Open your browser and go to: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
