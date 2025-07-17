import pandas as pd
from calculation_formulas import GunDrillTimeCalculator

# Load the GUNDRILL data
try:
    df_gundrill = pd.read_csv("/home/ubuntu/GUNDRILL.csv")
    print("GUNDRILL.csv loaded successfully.")
except Exception as e:
    print(f"Error loading GUNDRILL.csv: {e}")
    exit()

# Initialize the calculator
calculator = GunDrillTimeCalculator()

# Function to clean and convert time strings to minutes (float)
def clean_time_string(time_str):
    if pd.isna(time_str):
        return None
    time_str = str(time_str).replace(" MINS", "").replace(" MIN", "").strip()
    try:
        return float(time_str)
    except ValueError:
        return None

# Iterate through the GUNDRILL data and compare calculations
results = []
for index, row in df_gundrill.iterrows():
    matl_grade = str(row["MATL GRADE"]).strip() if pd.notna(row["MATL GRADE"]) else None
    drill_size_str = str(row["DRILL SIZE"]).replace("\"", "").strip()
    
    # Skip rows that don't have a material grade or drill size (these are often headers or empty rows)
    if not matl_grade or not drill_size_str:
        continue

    try:
        drill_size = float(drill_size_str)
        rpm = float(row["RPM"])
        feed_rate_str = str(row["FEED RATE"]).replace(" IN/MIN", "").strip()
        feed_rate = float(feed_rate_str)

        # Excel values
        excel_time_5_inch = clean_time_string(row[" TIME TAKEN FOR  5.0\""])
        excel_total_time_10_inch = clean_time_string(row["TOTAL TIME TAKEN FOR 10.0\""])
        excel_total_time_5_inch = clean_time_string(row["TOTAL TIME TAKEN FOR 5.0\""])
        excel_grinding_time_10_inch = clean_time_string(row["GRINDING TIME FOR EVERY 10\""])
        excel_setup_tool = clean_time_string(row["SET UP TOOL AFTER GRINDING"])
        excel_wall_thickness_insp = clean_time_string(row["WALL THICKNESS INSP TIME"])

        # Convert inches to mm for the Python code (1 inch = 25.4 mm)
        drill_size_mm = drill_size * 25.4
        length_to_drill_5_inch_mm = 5.0 * 25.4
        length_to_drill_10_inch_mm = 10.0 * 25.4
        feed_rate_mm_min = feed_rate * 25.4

        # Calculate cutting time for 5 inches using the Python function
        calculated_cutting_time_5_inch = calculator.calculate_cutting_time(
            drill_size=drill_size_mm,
            length_to_drill=length_to_drill_5_inch_mm,
            rpm=rpm,
            feed_rate=feed_rate_mm_min,
            material_grade=matl_grade
        )
        
        # Calculate total time for 10 inches using the Python function
        # Need to infer parameters for total_standard_time from Excel
        # Assuming grinding frequency is 10 (from column name) and 1 feature
        # Assuming wall thickness inspection is true if there's a value in the column
        # Assuming tool wear consideration is true
        
        # For 10 inch total time, we need to consider 10 inches of drilling, setup, grinding, and inspection
        # The Excel sheet has 'GRINDING TIME FOR EVERY 10"', 'SET UP TOOL AFTER GRINDING', 'WALL THICKNESS INSP TIME'
        # Let's try to replicate the Excel logic for total time for 10 inches
        
        # Excel's 'TIME TAKEN FOR 5.0"' seems to be the cutting time for 5 inches
        # Excel's 'GRINDING TIME FOR EVERY 10"' seems to be grinding time per 10 inches of drilling
        # Excel's 'SET UP TOOL AFTER GRINDING' seems to be setup time
        # Excel's 'WALL THICKNESS INSP TIME' seems to be inspection time
        
        # Let's assume the Excel's 'TOTAL TIME TAKEN FOR 10.0"' is:
        # (Cutting Time for 10") + (Grinding Time for Every 10") + (Set Up Tool After Grinding) + (Wall Thickness Insp Time)
        
        # Calculate cutting time for 10 inches
        calculated_cutting_time_10_inch = calculator.calculate_cutting_time(
            drill_size=drill_size_mm,
            length_to_drill=length_to_drill_10_inch_mm,
            rpm=rpm,
            feed_rate=feed_rate_mm_min,
            material_grade=matl_grade
        )

        # Attempt to calculate total time for 10 inches based on Excel's implied formula
        # This is a simplified approach, as the Python function `calculate_total_standard_time` is more complex
        # and includes tool wear, which might not be directly reflected in the Excel's simple sum.
        
        # Let's use the individual components from the Python calculator to see if they match Excel's components
        calculated_setup_time = calculator.calculate_setup_time(drill_size_mm, matl_grade, length_to_drill_10_inch_mm, custom_setup_time=excel_setup_tool)
        calculated_grinding_time_per_operation = calculator.calculate_grinding_time(drill_size_mm, length_to_drill_10_inch_mm, grinding_frequency=10, custom_grinding_time=excel_grinding_time_10_inch)
        calculated_inspection_time = calculator.calculate_inspection_time(length_to_drill_10_inch_mm, wall_thickness_inspection=(excel_wall_thickness_insp is not None), number_of_features=1)
        # Reconstruct Excel's total time for 10 inches based on the Excel's columns
        # This is a direct sum of the values in the Excel columns, assuming they are directly additive.
        excel_reconstructed_total_10_inch = None
        if excel_time_5_inch is not None and excel_grinding_time_10_inch is not None and excel_setup_tool is not None and excel_wall_thickness_insp is not None:
            # The Excel sheet has 'TIME TAKEN FOR 5.0"' and 'TOTAL TIME TAKEN FOR 10.0"'
            # It implies that 'TIME TAKEN FOR 5.0"' is the cutting time for 5 inches.
            # So for 10 inches, it would be 2 * 'TIME TAKEN FOR 5.0"'
            excel_reconstructed_total_10_inch = (2 * excel_time_5_inch) + excel_grinding_time_10_inch + excel_setup_tool + excel_wall_thickness_insp

        # Now, let's use the full Python `calculate_total_standard_time` function
        # We need to be careful with the `length_to_drill` parameter here.
        # The Excel sheet has 'TOTAL TIME TAKEN FOR 10.0"', so `length_to_drill` should be 10 inches.
        
        # For the total standard time calculation, we need to pass the actual length to drill.
        # The Excel sheet has 'TOTAL TIME TAKEN FOR 10.0"', so we use 10 inches for length_to_drill.
        
        # The `calculate_total_standard_time` function calculates total time for `number_of_features`.
        # If we assume 1 feature for each row in Excel, then `length_to_drill` is the total length for that feature.
        # The Excel columns are for 5.0" and 10.0" total times, implying the length.
        
        # Let's assume `number_of_features` is 1 for now, and `length_to_drill` is 10 inches for the 10 inch total time.
        # The Excel sheet also has 'GRINDING TIME FOR EVERY 10"', which implies grinding frequency of 10 inches.
        # The Python function has `grinding_frequency` as number of holes before grinding.
        # This is a discrepancy. For now, let's assume `grinding_frequency` in Python refers to the length interval.
        # This is a point to clarify or note as a potential difference.
        
        # For now, let's use the `custom_grinding_time` and `custom_setup_time` to match Excel's values if available.
        # This will help isolate the `cutting_time` logic.
        
        # Let's try to calculate the total time using the Python function with parameters that align with the Excel sheet.
        # For 'TOTAL TIME TAKEN FOR 10.0"', we assume length_to_drill = 10 inches.
        # We also need to decide on `tool_wear_consideration` and `wall_thickness_inspection`.
        # Based on the Excel columns, it seems wall thickness inspection is considered if the column has a value.
        # Tool wear is not explicitly mentioned in Excel, so we'll assume it's `True` as per the default in the Python code.
        
        calculated_total_standard_time_10_inch_dict = calculator.calculate_total_standard_time(
            drill_size=drill_size_mm,
            length_to_drill=length_to_drill_10_inch_mm,
            rpm=rpm,
            feed_rate=feed_rate_mm_min,
            material_grade=matl_grade,
            number_of_features=1, # Assuming 1 feature for each row in Excel
            tool_wear_consideration=True, # Assuming tool wear is considered
            wall_thickness_inspection=(excel_wall_thickness_insp is not None), # True if there's a value
            custom_setup_time=excel_setup_tool, # Use Excel's setup time if available
            custom_grinding_time=excel_grinding_time_10_inch, # Use Excel's grinding time if available
            grinding_frequency=1 # This parameter is tricky, as Excel has 'EVERY 10"'. Let's set to 1 for now and note the discrepancy.
        )
        calculated_total_standard_time_10_inch = calculated_total_standard_time_10_inch_dict.get("total_standard_time")

        results.append({
            "MATL GRADE": matl_grade,
            "DRILL SIZE": drill_size,
            "RPM": rpm,
            "FEED RATE": feed_rate,
            "Excel Time 5.0\" (mins)": excel_time_5_inch,
            "Calculated Cutting Time 5.0\" (mins)": calculated_cutting_time_5_inch,
            "Excel Total Time 10.0\" (mins)": excel_total_time_10_inch,
            "Excel Reconstructed Total 10.0\" (mins)": excel_reconstructed_total_10_inch,
            "Calculated Total Standard Time 10.0\" (mins)": calculated_total_standard_time_10_inch,
            "Excel Grinding Time 10\" (mins)": excel_grinding_time_10_inch,
            "Calculated Grinding Time (Python)": calculated_grinding_time_per_operation,
            "Excel Setup Time (mins)": excel_setup_tool,
            "Calculated Setup Time (Python)": calculated_setup_time,
            "Excel Inspection Time (mins)": excel_wall_thickness_insp,
            "Calculated Inspection Time (Python)": calculated_inspection_time
        })

    except ValueError as ve:
        print(f"Skipping row {index} due to data conversion error: {ve} in row: {row.to_dict()}")
    except Exception as ex:
        print(f"Skipping row {index} due to unexpected error: {ex} in row: {row.to_dict()}")

df_results = pd.DataFrame(results)
print("\nComparison Results:")
print(df_results.to_string())

# Save results to a CSV for further analysis
df_results.to_csv("/home/ubuntu/comparison_results_gundrill.csv", index=False)
print("Comparison results saved to /home/ubuntu/comparison_results_gundrill.csv")

# Now, let's analyze FMJ-PORT.csv
try:
    df_fmjport = pd.read_csv("/home/ubuntu/FMJ-PORT.csv")
    print("\nFMJ-PORT.csv loaded successfully.")
except Exception as e:
    print(f"Error loading FMJ-PORT.csv: {e}")
    exit()

fmj_results = []
for index, row in df_fmjport.iterrows():
    matl_grade = str(row["FMJ PORT-LOW CHROME MATERIAL"]).strip() if pd.notna(row["FMJ PORT-LOW CHROME MATERIAL"]) else None
    operation = str(row["OPERATION"]).strip() if pd.notna(row["OPERATION"]) else None
    
    if not matl_grade and not operation:
        continue

    try:
        # The FMJ-PORT sheet has different columns and likely different calculation logic.
        # The `calculation_formulas.py` primarily focuses on 'Gun Drill' operations.
        # The FMJ-PORT sheet has 'DRILL', 'ROUGH FMJ FARM TOOL', 'FINISH FMJ FARM TOOL', 'THREAD MILL'.
        # The Python code's `calculate_cutting_time` is generic but its factors are for drilling.
        # The `calculate_total_standard_time` is also for 'gun drilling operation'.
        
        # For FMJ-PORT, we will primarily compare the RPM, FEED RATE, and TIME TAKEN values.
        # The Python code does not have specific functions for 'FARM TOOL' or 'THREAD MILL' operations.
        # So, direct comparison of calculated time might not be possible for all rows.
        
        # Let's focus on the 'DRILL' operations in FMJ-PORT and try to apply the cutting time calculation.
        
        if operation and "DRILL" in operation.upper():
            drill_size_fmj_str = operation.replace("DRILL", "").replace("\"", "").strip()
            drill_size_fmj = float(drill_size_fmj_str)
            length_fmj_str = str(row["LENGTH"]).replace("\"", "").strip()
            length_fmj = float(length_fmj_str)
            rpm_fmj = float(row["RPM"])
            feed_rate_fmj_str = str(row["FEED RATE"]).replace(" IN/MIN", "").strip()
            feed_rate_fmj = float(feed_rate_fmj_str)
            excel_time_taken_fmj = clean_time_string(row["TIME TAKEN"])

            # Convert to mm
            drill_size_fmj_mm = drill_size_fmj * 25.4
            length_fmj_mm = length_fmj * 25.4
            feed_rate_fmj_mm_min = feed_rate_fmj * 25.4

            calculated_cutting_time_fmj = calculator.calculate_cutting_time(
                drill_size=drill_size_fmj_mm,
                length_to_drill=length_fmj_mm,
                rpm=rpm_fmj,
                feed_rate=feed_rate_fmj_mm_min,
                material_grade=matl_grade
            )
            fmj_results.append({
                "MATL GRADE": matl_grade,
                "OPERATION": operation,
                "LENGTH": length_fmj,
                "RPM": rpm_fmj,
                "FEED RATE": feed_rate_fmj,
                "Excel Time Taken (mins)": excel_time_taken_fmj,
                "Calculated Cutting Time (mins)": calculated_cutting_time_fmj
            })
        else:
            fmj_results.append({
                "MATL GRADE": matl_grade,
                "OPERATION": operation,
                "LENGTH": row["LENGTH"],
                "RPM": row["RPM"],
                "FEED RATE": row["FEED RATE"],
                "Excel Time Taken (mins)": clean_time_string(row["TIME TAKEN"]),
                "Calculated Cutting Time (mins)": "N/A (Non-Drill Operation)"
            })

    except ValueError as ve:
        print(f"Skipping row {index} in FMJ-PORT due to data conversion error: {ve} in row: {row.to_dict()}")
    except Exception as ex:
        print(f"Skipping row {index} in FMJ-PORT due to unexpected error: {ex} in row: {row.to_dict()}")

df_fmj_results = pd.DataFrame(fmj_results)
print("\nFMJ-PORT Comparison Results:")
print(df_fmj_results.to_string())

df_fmj_results.to_csv("/home/ubuntu/comparison_results_fmj_port.csv", index=False)
print("FMJ-PORT comparison results saved to /home/ubuntu/comparison_results_fmj_port.csv")




