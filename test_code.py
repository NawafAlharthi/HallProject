import pandas as pd
from calculation_formulas import GunDrillTimeCalculator

# Initialize the calculator
calculator = GunDrillTimeCalculator()

# Test cases
test_cases = [
    # Test 1: Baseline with steel
    {
        'test_name': 'Baseline Steel',
        'params': {
            'drill_size': 10.0, 'length_to_drill': 100.0, 'rpm': 1800, 'feed_rate': 80.0,
            'material_grade': 'Steel', 'number_of_features': 1, 'tool_wear_consideration': True,
            'wall_thickness_inspection': True, 'grinding_frequency': 10
        }
    },
    # Test 2: Longer length to check cumulative effect
    {
        'test_name': 'Longer Length Steel',
        'params': {
            'drill_size': 10.0, 'length_to_drill': 500.0, 'rpm': 1800, 'feed_rate': 80.0,
            'material_grade': 'Steel', 'number_of_features': 1, 'tool_wear_consideration': True,
            'wall_thickness_inspection': True, 'grinding_frequency': 10
        }
    },
    # Test 3: Hard material (Stainless Steel)
    {
        'test_name': 'Hard Material (Stainless Steel)',
        'params': {
            'drill_size': 10.0, 'length_to_drill': 100.0, 'rpm': 1800, 'feed_rate': 80.0,
            'material_grade': 'Stainless Steel', 'number_of_features': 1, 'tool_wear_consideration': True,
            'wall_thickness_inspection': True, 'grinding_frequency': 10
        }
    },
    # Test 4: Hard material (Titanium)
    {
        'test_name': 'Hard Material (Titanium)',
        'params': {
            'drill_size': 10.0, 'length_to_drill': 100.0, 'rpm': 1800, 'feed_rate': 80.0,
            'material_grade': 'Titanium', 'number_of_features': 1, 'tool_wear_consideration': True,
            'wall_thickness_inspection': True, 'grinding_frequency': 10
        }
    },
    # Test 5: Customization - Custom Setup Time
    {
        'test_name': 'Custom Setup Time',
        'params': {
            'drill_size': 10.0, 'length_to_drill': 100.0, 'rpm': 1800, 'feed_rate': 80.0,
            'material_grade': 'Steel', 'number_of_features': 1, 'tool_wear_consideration': True,
            'wall_thickness_inspection': True, 'grinding_frequency': 10, 'custom_setup_time': 15.0
        }
    },
    # Test 6: Customization - Custom Grinding Time
    {
        'test_name': 'Custom Grinding Time',
        'params': {
            'drill_size': 10.0, 'length_to_drill': 100.0, 'rpm': 1800, 'feed_rate': 80.0,
            'material_grade': 'Steel', 'number_of_features': 1, 'tool_wear_consideration': True,
            'wall_thickness_inspection': True, 'grinding_frequency': 10, 'custom_grinding_time': 5.0
        }
    }
]

results = []
for test in test_cases:
    test_name = test['test_name']
    params = test['params']
    result = calculator.calculate_total_standard_time(**params)
    result['test_name'] = test_name
    results.append(result)

df_results = pd.DataFrame(results)

# Reorder columns to have test_name first
cols = ['test_name'] + [col for col in df_results.columns if col != 'test_name']
df_results = df_results[cols]

print("Test Results:")
print(df_results.to_string())

# Save results to a CSV for further analysis
df_results.to_csv("/home/ubuntu/test_results.csv", index=False)
print("\nTest results saved to /home/ubuntu/test_results.csv")


