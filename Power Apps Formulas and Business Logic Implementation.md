# Power Apps Formulas and Business Logic Implementation

## 1. Introduction

This document provides the complete set of Power Apps formulas and business logic implementation for the Gun Drill Machine Standard Time Calculator. These formulas translate the mathematical calculations into Power Apps expressions that can be directly used in the application.

## 2. Core Calculation Variables

### 2.1 Input Variables
The following variables should be defined in Power Apps to capture user inputs:

```powerapps
// User Input Variables
Set(varDrillSize, Value(txtDrillSize.Text));
Set(varLengthToDrill, Value(txtLengthToDrill.Text));
Set(varRPM, Value(txtRPM.Text));
Set(varFeedRate, Value(txtFeedRate.Text));
Set(varMaterialGrade, ddMaterialGrade.Selected.Value);
Set(varNumberOfFeatures, Value(txtNumberOfFeatures.Text));
Set(varToolWearConsideration, chkToolWear.Value);
Set(varWallThicknessInspection, chkWallThickness.Value);
Set(varCustomSetupTime, If(IsBlank(txtCustomSetupTime.Text), Blank(), Value(txtCustomSetupTime.Text)));
Set(varCustomGrindingTime, If(IsBlank(txtCustomGrindingTime.Text), Blank(), Value(txtCustomGrindingTime.Text)));
Set(varGrindingFrequency, If(IsBlank(txtGrindingFreq.Text), 10, Value(txtGrindingFreq.Text)));
```

## 3. Validation Formulas

### 3.1 Input Validation Function
```powerapps
// Input Validation Formula
Set(varValidationResult,
    With(
        {
            DrillSizeValid: And(Not(IsBlank(varDrillSize)), varDrillSize > 0, varDrillSize <= 50),
            LengthValid: And(Not(IsBlank(varLengthToDrill)), varLengthToDrill > 0, varLengthToDrill <= 1000),
            RPMValid: And(Not(IsBlank(varRPM)), varRPM > 0, varRPM <= 10000),
            FeedRateValid: And(Not(IsBlank(varFeedRate)), varFeedRate > 0, varFeedRate <= 1000),
            FeaturesValid: And(Not(IsBlank(varNumberOfFeatures)), varNumberOfFeatures > 0, varNumberOfFeatures <= 100)
        },
        {
            IsValid: And(DrillSizeValid, LengthValid, RPMValid, FeedRateValid, FeaturesValid),
            ErrorMessage: Concatenate(
                If(Not(DrillSizeValid), "Drill size must be between 0 and 50mm; ", ""),
                If(Not(LengthValid), "Length must be between 0 and 1000mm; ", ""),
                If(Not(RPMValid), "RPM must be between 0 and 10000; ", ""),
                If(Not(FeedRateValid), "Feed rate must be between 0 and 1000 mm/min; ", ""),
                If(Not(FeaturesValid), "Number of features must be between 1 and 100; ", "")
            )
        }
    )
);
```

## 4. Core Calculation Formulas

### 4.1 Cutting Time Calculation
```powerapps
// Cutting Time Formula
Set(varCuttingTime,
    With(
        {
            BasicCuttingTime: varLengthToDrill / varFeedRate,
            MaterialFactor: Switch(
                Lower(varMaterialGrade),
                "aluminum", 0.8,
                "steel", 1.0,
                "stainless steel", 1.3,
                "cast iron", 1.1,
                "titanium", 1.6,
                "brass", 0.9,
                "copper", 0.85,
                1.0
            ),
            SizeFactor: If(
                varDrillSize <= 5, 1.1,
                If(varDrillSize <= 10, 1.0,
                    If(varDrillSize <= 20, 1.05, 1.15)
                )
            ),
            OptimalRPM: (40 * 1000) / (Pi() * varDrillSize),
            RPMRatio: varRPM / OptimalRPM,
            RPMFactor: If(
                And(RPMRatio >= 0.8, RPMRatio <= 1.2), 1.0,
                If(Or(And(RPMRatio >= 0.6, RPMRatio < 0.8), And(RPMRatio > 1.2, RPMRatio <= 1.5)), 1.1, 1.25)
            )
        },
        Round(BasicCuttingTime * MaterialFactor * SizeFactor * RPMFactor, 2)
    )
);
```

### 4.2 Setup Time Calculation
```powerapps
// Setup Time Formula
Set(varSetupTime,
    If(
        Not(IsBlank(varCustomSetupTime)),
        varCustomSetupTime,
        With(
            {
                BaseSetupTime: 5.0,
                SizeFactor: If(varDrillSize > 20, 1.5, If(varDrillSize > 10, 1.2, 1.0)),
                MaterialFactor: If(
                    Or(
                        Lower(varMaterialGrade) = "steel",
                        Lower(varMaterialGrade) = "stainless steel",
                        Lower(varMaterialGrade) = "titanium"
                    ),
                    1.3,
                    1.0
                )
            },
            Round(BaseSetupTime * SizeFactor * MaterialFactor, 2)
        )
    )
);
```

### 4.3 Grinding Time Calculation
```powerapps
// Grinding Time Formula
Set(varGrindingTime,
    If(
        Not(IsBlank(varCustomGrindingTime)),
        varCustomGrindingTime,
        With(
            {
                BaseGrindingTime: 2.5,
                SizeFactor: If(varDrillSize > 15, 1.4, If(varDrillSize > 8, 1.2, 1.0))
            },
            Round((BaseGrindingTime * SizeFactor) / varGrindingFrequency, 2)
        )
    )
);
```

### 4.4 Inspection Time Calculation
```powerapps
// Inspection Time Formula
Set(varInspectionTime,
    With(
        {
            BaseInspectionTime: 1.0,
            WallThicknessFactor: If(varWallThicknessInspection, 1.8, 1.0)
        },
        Round(BaseInspectionTime * WallThicknessFactor * varNumberOfFeatures, 2)
    )
);
```

### 4.5 Total Standard Time Calculation
```powerapps
// Total Standard Time Formula
Set(varCalculationResults,
    With(
        {
            ToolWearFactor: If(varToolWearConsideration, 0.02, 0),
            CuttingTimeWithWear: varCuttingTime * (1 + ToolWearFactor),
            PerFeatureTime: CuttingTimeWithWear + varGrindingTime,
            TotalCuttingTime: PerFeatureTime * varNumberOfFeatures,
            TotalGrindingTime: varGrindingTime * varNumberOfFeatures,
            ToolWearAdditionalTime: If(varToolWearConsideration, varCuttingTime * ToolWearFactor * varNumberOfFeatures, 0)
        },
        {
            CuttingTimePerFeature: Round(varCuttingTime, 2),
            TotalCuttingTime: Round(TotalCuttingTime, 2),
            SetupTime: Round(varSetupTime, 2),
            GrindingTimePerFeature: Round(varGrindingTime, 2),
            TotalGrindingTime: Round(TotalGrindingTime, 2),
            InspectionTime: Round(varInspectionTime, 2),
            ToolWearFactorApplied: varToolWearConsideration,
            ToolWearAdditionalTime: Round(ToolWearAdditionalTime, 2),
            TotalStandardTime: Round(TotalCuttingTime + varSetupTime + varInspectionTime, 2),
            NumberOfFeatures: varNumberOfFeatures
        }
    )
);
```

## 5. Data Source Integration

### 5.1 Time Study Data Lookup
```powerapps
// Lookup time study data from Excel/SharePoint
Set(varTimeStudyData,
    LookUp(
        TimeStudyDataSource,
        And(
            MaterialGrade = varMaterialGrade,
            DrillSize >= varDrillSize - 0.5,
            DrillSize <= varDrillSize + 0.5
        )
    )
);

// Use lookup data if available, otherwise use calculated values
Set(varAdjustedCuttingTime,
    If(
        Not(IsBlank(varTimeStudyData)),
        varTimeStudyData.CuttingTimeFactor * (varLengthToDrill / varFeedRate),
        varCuttingTime
    )
);
```

### 5.2 Historical Data Storage
```powerapps
// Save calculation results to SharePoint
Patch(
    CalculationHistoryList,
    Defaults(CalculationHistoryList),
    {
        JobID: txtJobID.Text,
        PartName: txtPartName.Text,
        MaterialGrade: varMaterialGrade,
        DrillSize: varDrillSize,
        LengthToDrill: varLengthToDrill,
        RPM: varRPM,
        FeedRate: varFeedRate,
        NumberOfFeatures: varNumberOfFeatures,
        TotalStandardTime: varCalculationResults.TotalStandardTime,
        CalculatedBy: User().FullName,
        DateCalculated: Now()
    }
);
```

## 6. Error Handling and User Feedback

### 6.1 Error Display Formula
```powerapps
// Display validation errors
If(
    Not(varValidationResult.IsValid),
    Notify(varValidationResult.ErrorMessage, NotificationType.Error),
    // Proceed with calculation
    Set(varCalculationInProgress, true);
    // Run calculation formulas here
    Set(varCalculationInProgress, false);
    Notify("Calculation completed successfully!", NotificationType.Success)
);
```

### 6.2 Progress Indicator
```powerapps
// Progress indicator visibility
Set(varShowProgress, varCalculationInProgress);

// Progress bar value (simulate calculation steps)
Set(varProgressValue,
    If(varCalculationInProgress,
        // Simulate progress through calculation steps
        If(varCuttingTime > 0, 25,
            If(varSetupTime > 0, 50,
                If(varGrindingTime > 0, 75,
                    If(varInspectionTime > 0, 100, 0)
                )
            )
        ),
        0
    )
);
```

## 7. Export and Reporting Functions

### 7.1 Excel Export Formula
```powerapps
// Create Excel export data
Set(varExportData,
    Table(
        {
            Parameter: "Job ID", Value: txtJobID.Text
        },
        {
            Parameter: "Part Name", Value: txtPartName.Text
        },
        {
            Parameter: "Material Grade", Value: varMaterialGrade
        },
        {
            Parameter: "Drill Size (mm)", Value: Text(varDrillSize)
        },
        {
            Parameter: "Length to Drill (mm)", Value: Text(varLengthToDrill)
        },
        {
            Parameter: "RPM", Value: Text(varRPM)
        },
        {
            Parameter: "Feed Rate (mm/min)", Value: Text(varFeedRate)
        },
        {
            Parameter: "Number of Features", Value: Text(varNumberOfFeatures)
        },
        {
            Parameter: "Cutting Time per Feature (min)", Value: Text(varCalculationResults.CuttingTimePerFeature)
        },
        {
            Parameter: "Total Cutting Time (min)", Value: Text(varCalculationResults.TotalCuttingTime)
        },
        {
            Parameter: "Setup Time (min)", Value: Text(varCalculationResults.SetupTime)
        },
        {
            Parameter: "Grinding Time per Feature (min)", Value: Text(varCalculationResults.GrindingTimePerFeature)
        },
        {
            Parameter: "Total Grinding Time (min)", Value: Text(varCalculationResults.TotalGrindingTime)
        },
        {
            Parameter: "Inspection Time (min)", Value: Text(varCalculationResults.InspectionTime)
        },
        {
            Parameter: "Tool Wear Additional Time (min)", Value: Text(varCalculationResults.ToolWearAdditionalTime)
        },
        {
            Parameter: "Total Standard Time (min)", Value: Text(varCalculationResults.TotalStandardTime)
        }
    )
);
```

## 8. Screen-Specific Formulas

### 8.1 Main Calculation Button OnSelect
```powerapps
// Main Calculate Button OnSelect Formula
If(
    varValidationResult.IsValid,
    // Set calculation in progress
    Set(varCalculationInProgress, true);
    
    // Run all calculation formulas
    // (Insert all calculation formulas here)
    
    // Navigate to results screen
    Navigate(ResultsScreen, ScreenTransition.Fade);
    Set(varCalculationInProgress, false),
    
    // Show validation error
    Notify(varValidationResult.ErrorMessage, NotificationType.Error)
);
```

### 8.2 Results Screen OnVisible
```powerapps
// Results Screen OnVisible Formula
// Update result display controls
UpdateContext({
    locCuttingTime: varCalculationResults.CuttingTimePerFeature,
    locTotalCuttingTime: varCalculationResults.TotalCuttingTime,
    locSetupTime: varCalculationResults.SetupTime,
    locGrindingTime: varCalculationResults.GrindingTimePerFeature,
    locTotalGrindingTime: varCalculationResults.TotalGrindingTime,
    locInspectionTime: varCalculationResults.InspectionTime,
    locTotalTime: varCalculationResults.TotalStandardTime
});
```

## 9. Performance Optimization

### 9.1 Efficient Data Loading
```powerapps
// Load time study data efficiently on app start
OnStart = 
    // Cache frequently used data
    Set(varMaterialGrades, 
        Distinct(TimeStudyDataSource, MaterialGrade).Result
    );
    Set(varDrillSizeRanges,
        Sort(Distinct(TimeStudyDataSource, DrillSize).Result, Value)
    );
```

### 9.2 Conditional Calculations
```powerapps
// Only recalculate when inputs change
If(
    Or(
        varDrillSize <> varPreviousDrillSize,
        varLengthToDrill <> varPreviousLength,
        varRPM <> varPreviousRPM,
        varFeedRate <> varPreviousFeedRate,
        varMaterialGrade <> varPreviousMaterialGrade
    ),
    // Run calculations and update previous values
    // (Insert calculation formulas)
    Set(varPreviousDrillSize, varDrillSize);
    Set(varPreviousLength, varLengthToDrill);
    Set(varPreviousRPM, varRPM);
    Set(varPreviousFeedRate, varFeedRate);
    Set(varPreviousMaterialGrade, varMaterialGrade)
);
```

## 10. Testing and Validation

### 10.1 Test Cases
The following test cases should be implemented to validate the formulas:

1. **Basic Calculation Test**
   - Drill Size: 10mm, Length: 100mm, RPM: 1800, Feed Rate: 80 mm/min
   - Material: Steel, Features: 2
   - Expected Total Time: ~17.2 minutes

2. **Edge Case Tests**
   - Minimum values (drill size: 1mm, length: 1mm)
   - Maximum values (drill size: 50mm, length: 1000mm)
   - Different material grades
   - Custom setup and grinding times

3. **Validation Tests**
   - Invalid inputs (negative values, zero values)
   - Out-of-range inputs
   - Missing required fields

### 10.2 Formula Verification
Each formula should be tested against the Python implementation to ensure consistency and accuracy in calculations.

