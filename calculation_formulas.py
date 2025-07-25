"""
Gun Drill Machine Standard Time Calculator - Business Logic Implementation
This module contains the core calculation formulas and business logic
that will be translated into Power Apps expressions.
"""

import math
from typing import Dict, Any, Optional, Tuple

class GunDrillTimeCalculator:
    """
    Core calculator class for gun drill machine standard time calculations.
    This class implements the business logic that will be translated to Power Apps.
    """
    
    def __init__(self):
        """Initialize the calculator with default parameters."""
        self.default_setup_time = 5.0  # minutes
        self.default_grinding_time = 2.5  # minutes
        self.default_inspection_time = 1.0  # minutes
        self.tool_wear_factor = 0.02  # 2% additional time for tool wear

    def calculate_cutting_time(self, 
                             drill_size: float, 
                             length_to_drill: float, 
                             rpm: float, 
                             feed_rate: float,
                             material_grade: str) -> float:
        """
        Calculate the base cutting time for drilling operation.
        
        Args:
            drill_size: Diameter of the drill bit (mm)
            length_to_drill: Total length to be drilled (mm)
            rpm: Revolutions per minute
            feed_rate: Feed rate (mm/min)
            material_grade: Material type (Steel, Aluminum, Cast Iron, etc.)
            
        Returns:
            Base cutting time in minutes
        """
        # Basic cutting time calculation: Length / Feed Rate
        basic_cutting_time = length_to_drill / feed_rate
        
        # Apply material factor
        material_factor = self._get_material_factor(material_grade)
        
        # Apply drill size factor (larger drills may require more time)
        size_factor = self._get_drill_size_factor(drill_size)
        
        # Apply RPM efficiency factor
        rpm_factor = self._get_rpm_factor(rpm, drill_size)
        
        cutting_time = basic_cutting_time * material_factor * size_factor * rpm_factor
        
        return round(cutting_time, 2)
    
    def calculate_setup_time(self, 
                           drill_size: float, 
                           material_grade: str,
                           length_to_drill: float,
                           custom_setup_time: Optional[float] = None) -> float:
        """
        Calculate setup time based on drill size, material, and length.
        
        Args:
            drill_size: Diameter of the drill bit (mm)
            material_grade: Material type
            length_to_drill: Total length to be drilled (mm)
            custom_setup_time: Override default setup time if provided
            
        Returns:
            Setup time in minutes
        """
        if custom_setup_time is not None:
            return custom_setup_time
            
        # Base setup time
        setup_time = self.default_setup_time
        
        # Larger drills require more setup time
        if drill_size > 20:
            setup_time *= 1.5
        elif drill_size > 10:
            setup_time *= 1.2
            
        # Harder materials require more careful setup
        if material_grade.lower() in ["steel", "stainless steel", "titanium"]:
            setup_time *= 1.3
            
        # Length effect on setup time (e.g., longer parts might need more complex fixturing)
        # This is a simplified linear scaling. Adjust as needed.
        setup_time *= (1 + (length_to_drill / 1000) * 0.1) # 10% increase per meter of length
            
        return round(setup_time, 2)
    
    def calculate_grinding_time(self, 
                              drill_size: float,
                              length_to_drill: float,
                              grinding_frequency: int = 10,
                              custom_grinding_time: Optional[float] = None) -> float:
        """
        Calculate grinding time based on drill size, length, and grinding frequency.
        
        Args:
            drill_size: Diameter of the drill bit (mm)
            length_to_drill: Total length to be drilled (mm)
            grinding_frequency: Number of holes before grinding (default: 10)
            custom_grinding_time: Override default grinding time if provided
            
        Returns:
            Grinding time per operation in minutes
        """
        if custom_grinding_time is not None:
            return custom_grinding_time
            
        # Base grinding time
        grinding_time = self.default_grinding_time
        
        # Larger drills require more grinding time
        if drill_size > 15:
            grinding_time *= 1.4
        elif drill_size > 8:
            grinding_time *= 1.2
            
        # Grinding frequency based on length (e.g., more grinding for longer drills)
        # For simplicity, let's assume grinding is needed more frequently for longer drills.
        # This is a simplified linear scaling. Adjust as needed.
        grinding_time_per_operation = (grinding_time * (1 + (length_to_drill / 1000) * 0.05)) / grinding_frequency # 5% increase per meter of length
        
        return round(grinding_time_per_operation, 2)    
    def calculate_inspection_time(self, 
                                length_to_drill: float,
                                wall_thickness_inspection: bool = False,
                                number_of_features: int = 1) -> float:
        """
        Calculate inspection time based on inspection requirements and length.
        
        Args:
            length_to_drill: Total length to be drilled (mm)
            wall_thickness_inspection: Whether wall thickness inspection is required
            number_of_features: Number of features to inspect
            
        Returns:
            Inspection time in minutes
        """
        base_inspection_time = self.default_inspection_time
        
        # Wall thickness inspection adds additional time
        if wall_thickness_inspection:
            base_inspection_time *= 1.8
            
        # Multiple features require proportional inspection time
        total_inspection_time = base_inspection_time * number_of_features
        
        # Length effect on inspection time (e.g., longer parts might take longer to inspect)
        total_inspection_time *= (1 + (length_to_drill / 1000) * 0.08) # 8% increase per meter of length
        
        return round(total_inspection_time, 2)    
    def calculate_total_standard_time(self, 
                                    drill_size: float,
                                    length_to_drill: float,
                                    rpm: float,
                                    feed_rate: float,
                                    material_grade: str,
                                    number_of_features: int = 1,
                                    tool_wear_consideration: bool = True,
                                    wall_thickness_inspection: bool = False,
                                    custom_setup_time: Optional[float] = None,
                                    custom_grinding_time: Optional[float] = None,
                                    grinding_frequency: int = 10) -> Dict[str, float]:
        """
        Calculate the total standard time for gun drilling operation.
        
        Args:
            drill_size: Diameter of the drill bit (mm)
            length_to_drill: Total length to be drilled (mm)
            rpm: Revolutions per minute
            feed_rate: Feed rate (mm/min)
            material_grade: Material type
            number_of_features: Number of drilling features
            tool_wear_consideration: Whether to include tool wear factor
            wall_thickness_inspection: Whether wall thickness inspection is required
            custom_setup_time: Override default setup time
            custom_grinding_time: Override default grinding time
            grinding_frequency: Number of holes before grinding
            
        Returns:
            Dictionary containing detailed time breakdown
        """
        # Calculate individual time components
        cutting_time = self.calculate_cutting_time(
            drill_size, length_to_drill, rpm, feed_rate, material_grade
        )
        
        setup_time = self.calculate_setup_time(
            drill_size, material_grade, length_to_drill, custom_setup_time
        )
        
        grinding_time = self.calculate_grinding_time(
            drill_size, length_to_drill, grinding_frequency, custom_grinding_time
        )
        
        inspection_time = self.calculate_inspection_time(
            length_to_drill, wall_thickness_inspection, number_of_features
        )        
        # Calculate per-feature time
        per_feature_time = cutting_time + grinding_time + (inspection_time / number_of_features)
        
        # Apply tool wear factor if enabled
        if tool_wear_consideration:
            per_feature_time *= (1 + self.tool_wear_factor)
        
        # Calculate total time for all features
        total_cutting_time = per_feature_time * number_of_features
        total_time = total_cutting_time + setup_time + inspection_time
        
        return {
            'cutting_time_per_feature': round(cutting_time, 2),
            'total_cutting_time': round(total_cutting_time, 2),
            'setup_time': round(setup_time, 2),
            'grinding_time_per_feature': round(grinding_time, 2),
            'total_grinding_time': round(grinding_time * number_of_features, 2),
            'inspection_time': round(inspection_time, 2),
            'tool_wear_factor_applied': tool_wear_consideration,
            'tool_wear_additional_time': round(
                (per_feature_time * self.tool_wear_factor * number_of_features) if tool_wear_consideration else 0, 2
            ),
            'total_standard_time': round(total_time, 2),
            'number_of_features': number_of_features
        }
    
    def _get_material_factor(self, material_grade: str) -> float:
        """
        Get material-specific factor for cutting time calculation.
        
        Args:
            material_grade: Material type
            
        Returns:
            Material factor (multiplier)
        """
        material_factors = {
            'aluminum': 0.8,
            'steel': 1.0,
            'stainless steel': 1.5,  # Increased for harder material
            'cast iron': 1.1,
            'titanium': 1.8,  # Increased for harder material
            'brass': 0.9,
            'copper': 0.85
        }
        
        return material_factors.get(material_grade.lower(), 1.0)
    
    def _get_drill_size_factor(self, drill_size: float) -> float:
        """
        Get drill size factor for cutting time calculation.
        
        Args:
            drill_size: Diameter of the drill bit (mm)
            
        Returns:
            Size factor (multiplier)
        """
        if drill_size <= 5:
            return 1.1  # Small drills may require more careful operation
        elif drill_size <= 10:
            return 1.0
        elif drill_size <= 20:
            return 1.05
        else:
            return 1.15  # Large drills require more power and careful operation
    
    def _get_rpm_factor(self, rpm: float, drill_size: float) -> float:
        """
        Get RPM efficiency factor based on optimal RPM for drill size.
        
        Args:
            rpm: Actual RPM
            drill_size: Diameter of the drill bit (mm)
            
        Returns:
            RPM efficiency factor (multiplier)
        """
        # Calculate optimal RPM based on drill size (simplified formula)
        # Optimal surface speed for steel: ~30-50 m/min
        optimal_surface_speed = 40  # m/min
        optimal_rpm = (optimal_surface_speed * 1000) / (math.pi * drill_size)
        
        # Calculate efficiency factor based on deviation from optimal RPM
        rpm_ratio = rpm / optimal_rpm
        
        if 0.8 <= rpm_ratio <= 1.2:
            return 1.0  # Optimal range
        elif 0.6 <= rpm_ratio < 0.8 or 1.2 < rpm_ratio <= 1.5:
            return 1.1  # Slightly suboptimal
        else:
            return 1.25  # Significantly suboptimal
    
    def validate_input_parameters(self, **kwargs) -> Tuple[bool, str]:
        """
        Validate input parameters for calculation.
        
        Args:
            **kwargs: Input parameters to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        errors = []
        
        # Validate drill size
        drill_size = kwargs.get('drill_size')
        if drill_size is None or drill_size <= 0:
            errors.append("Drill size must be greater than 0")
        elif drill_size > 50:
            errors.append("Drill size exceeds maximum supported size (50mm)")
            
        # Validate length to drill
        length_to_drill = kwargs.get('length_to_drill')
        if length_to_drill is None or length_to_drill <= 0:
            errors.append("Length to drill must be greater than 0")
        elif length_to_drill > 1000:
            errors.append("Length to drill exceeds maximum supported length (1000mm)")
            
        # Validate RPM
        rpm = kwargs.get('rpm')
        if rpm is None or rpm <= 0:
            errors.append("RPM must be greater than 0")
        elif rpm > 10000:
            errors.append("RPM exceeds maximum supported value (10000)")
            
        # Validate feed rate
        feed_rate = kwargs.get('feed_rate')
        if feed_rate is None or feed_rate <= 0:
            errors.append("Feed rate must be greater than 0")
        elif feed_rate > 1000:
            errors.append("Feed rate exceeds maximum supported value (1000 mm/min)")
            
        # Validate number of features
        number_of_features = kwargs.get('number_of_features', 1)
        if number_of_features <= 0:
            errors.append("Number of features must be greater than 0")
        elif number_of_features > 100:
            errors.append("Number of features exceeds maximum supported value (100)")
            
        if errors:
            return False, "; ".join(errors)
        
        return True, ""


# Power Apps Formula Translations
class PowerAppsFormulas:
    """
    This class contains Power Apps formula equivalents for the calculation logic.
    These formulas can be directly used in Power Apps expressions.
    """
    
    @staticmethod
    def cutting_time_formula():
        """
        Power Apps formula for cutting time calculation.
        
        Returns:
            String containing Power Apps formula
        """
        return """
        // Calculate cutting time in Power Apps
        With(
            {
                BasicCuttingTime: LengthToDrill / FeedRate,
                MaterialFactor: Switch(
                    Lower(MaterialGrade),
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
                    DrillSize <= 5, 1.1,
                    If(DrillSize <= 10, 1.0,
                        If(DrillSize <= 20, 1.05, 1.15)
                    )
                ),
                OptimalRPM: (40 * 1000) / (Pi() * DrillSize),
                RPMRatio: RPM / OptimalRPM,
                RPMFactor: If(
                    And(RPMRatio >= 0.8, RPMRatio <= 1.2), 1.0,
                    If(Or(And(RPMRatio >= 0.6, RPMRatio < 0.8), And(RPMRatio > 1.2, RPMRatio <= 1.5)), 1.1, 1.25)
                )
            },
            Round(BasicCuttingTime * MaterialFactor * SizeFactor * RPMFactor, 2)
        )
        """
    
    @staticmethod
    def setup_time_formula():
        """
        Power Apps formula for setup time calculation.
        
        Returns:
            String containing Power Apps formula
        """
        return """
        // Calculate setup time in Power Apps
        If(
            IsBlank(CustomSetupTime),
            With(
                {
                    BaseSetupTime: 5.0,
                    SizeFactor: If(DrillSize > 20, 1.5, If(DrillSize > 10, 1.2, 1.0)),
                    MaterialFactor: If(
                        Or(
                            Lower(MaterialGrade) = "steel",
                            Lower(MaterialGrade) = "stainless steel",
                            Lower(MaterialGrade) = "titanium"
                        ),
                        1.3,
                        1.0
                    ),
                    LengthFactor: (1 + (LengthToDrill / 1000) * 0.1) // 10% increase per meter of length
                },
                Round(BaseSetupTime * SizeFactor * MaterialFactor * LengthFactor, 2)
            ),
            CustomSetupTime
        )        """
    
    @staticmethod
    def grinding_time_formula():
        """
        Power Apps formula for grinding time calculation.
        
        Returns:
            String containing Power Apps formula
        """
        return """
        // Calculate grinding time in Power Apps
        If(
            IsBlank(CustomGrindingTime),
            With(
                {
                    BaseGrindingTime: 2.5,
                    SizeFactor: If(DrillSize > 15, 1.4, If(DrillSize > 8, 1.2, 1.0)),
                    GrindingFrequency: If(IsBlank(GrindingFreq), 10, GrindingFreq),
                    LengthFactor: (1 + (LengthToDrill / 1000) * 0.05) // 5% increase per meter of length
                },
                Round((BaseGrindingTime * SizeFactor * LengthFactor) / GrindingFrequency, 2)
            ),
            CustomGrindingTime
        )        """
    
    @staticmethod
    def total_time_formula():
        """
        Power Apps formula for total standard time calculation.
        
        Returns:
            String containing Power Apps formula
        """
        return """
        // Calculate total standard time in Power Apps
        With(
            {
                CuttingTimePerFeature: /* Use cutting_time_formula result */,
                SetupTime: /* Use setup_time_formula result */,
                GrindingTimePerFeature: /* Use grinding_time_formula result */,
                InspectionTime: If(WallThicknessInspection, 1.0 * 1.8, 1.0) * NumberOfFeatures * (1 + (LengthToDrill / 1000) * 0.08),
                ToolWearFactor: If(ToolWearConsideration, 0.02, 0),
                PerFeatureTimeWithWear: CuttingTimePerFeature * (1 + ToolWearFactor) + GrindingTimePerFeature,
                TotalCuttingTime: PerFeatureTimeWithWear * NumberOfFeatures
            },
            {
                CuttingTimePerFeature: Round(CuttingTimePerFeature, 2),
                TotalCuttingTime: Round(TotalCuttingTime, 2),
                SetupTime: Round(SetupTime, 2),
                GrindingTimePerFeature: Round(GrindingTimePerFeature, 2),
                TotalGrindingTime: Round(GrindingTimePerFeature * NumberOfFeatures, 2),
                InspectionTime: Round(InspectionTime, 2),
                TotalStandardTime: Round(TotalCuttingTime + SetupTime + InspectionTime, 2)
            }
        )
        """


# Example usage and testing
if __name__ == "__main__":
    # Create calculator instance
    calculator = GunDrillTimeCalculator()
    
    # Example calculation
    test_parameters = {
        'drill_size': 10.0,  # mm
        'length_to_drill': 100.0,  # mm
        'rpm': 1800,
        'feed_rate': 80.0,  # mm/min
        'material_grade': 'Steel',
        'number_of_features': 2,
        'tool_wear_consideration': True,
        'wall_thickness_inspection': True,
        'grinding_frequency': 10
    }
    
    # Validate parameters
    is_valid, error_message = calculator.validate_input_parameters(**test_parameters)
    
    if is_valid:
        # Calculate total time
        result = calculator.calculate_total_standard_time(**test_parameters)
        
        print("Gun Drill Time Calculation Results:")
        print("=" * 40)
        for key, value in result.items():
            print(f"{key.replace('_', ' ').title()}: {value}")
    else:
        print(f"Validation Error: {error_message}")

