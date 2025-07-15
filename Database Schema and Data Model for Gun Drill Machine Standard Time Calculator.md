# Database Schema and Data Model for Gun Drill Machine Standard Time Calculator

## 1. Introduction
This document outlines the proposed database schema and data model for the Gun Drill Machine Standard Time Calculator. The design aims to support the functional requirements of the Power Apps application, ensuring efficient storage and retrieval of time study data, input parameters, and calculated results. The initial implementation will leverage an Excel spreadsheet, with a clear path for migration to a SharePoint List for enhanced scalability and collaboration.

## 2. Data Sources and Storage

The primary data source for time study information is identified as an Excel spreadsheet (`GUN DRILL TIME CALC-XL.xlsx`) or a SharePoint List. This data will be central to the calculation logic within the Power Apps application. Input parameters provided by the user and the calculated outputs will also need to be stored, potentially in a separate SharePoint List or within the Power Apps environment itself for historical logging.

## 3. Proposed Tables and Fields

### 3.1. Time Study Data Table (e.g., `TimeStudyData`)
This table will store the core time study values, mapped by various drilling parameters. This data will be used to look up base cutting times and other relevant factors.

| Field Name          | Data Type | Description                                                               | Example Values                                |
| :------------------ | :-------- | :------------------------------------------------------------------------ | :-------------------------------------------- |
| `MaterialGrade`     | Text      | Grade or type of the material being drilled.                              | Steel, Aluminum, Cast Iron                    |
| `DrillSize`         | Number    | Diameter of the drill bit in appropriate units (e.g., mm or inches).      | 5.0, 10.5, 25.0                               |
| `RPM`               | Number    | Revolutions Per Minute for the drilling operation.                        | 1500, 2000, 2500                              |
| `FeedRate`          | Number    | Feed rate of the drill in appropriate units (e.g., mm/min or inches/min). | 50, 100, 150                                  |
| `CuttingTimeFactor` | Number    | Factor used to calculate the base cutting time.                           | 0.05, 0.08, 0.12                              |
| `ToolWearFactor`    | Number    | Factor accounting for tool wear, if applicable.                           | 0.01, 0.02, 0.03                              |
| `OtherFactor1`      | Number    | Placeholder for additional time study factors.                            |                                               |
| `OtherFactor2`      | Number    | Placeholder for additional time study factors.                            |                                               |

### 3.2. Job/Part Details Table (e.g., `JobDetails`)
This table will store information about the specific job or part for which the drilling operation is being calculated. This can be used for historical logging and reporting.

| Field Name        | Data Type | Description                                        | Example Values             |
| :---------------- | :-------- | :------------------------------------------------- | :------------------------- |
| `JobID`           | Text      | Unique identifier for the job or part.             | J-001, P-54321             |
| `PartName`        | Text      | Name or description of the part.                   | Engine Block, Gear Housing |
| `MaterialGrade`   | Text      | Material grade for the specific job.               | Steel                      |
| `LengthToDrill`   | Number    | Total length to be drilled for the job/part.       | 100, 250, 500              |
| `NumberOfFeatures`| Number    | Number of drilling features for the job/part.      | 1, 2, 5                    |
| `DateCalculated`  | Date/Time | Timestamp when the calculation was performed.      | 2025-07-14 10:30:00        |
| `CalculatedBy`    | Text      | User who performed the calculation.                | John Doe                   |

### 3.3. Calculation Results Table (e.g., `CalculationResults`)
This table will store the detailed results of each calculation, linked to the `JobDetails` table.

| Field Name          | Data Type | Description                                                    | Example Values |
| :------------------ | :-------- | :------------------------------------------------------------- | :------------- |
| `ResultID`          | Text      | Unique identifier for each calculation result.                 | R-001          |
| `JobID`             | Text      | Foreign key linking to the `JobDetails` table.                 | J-001          |
| `DrillSizeUsed`     | Number    | Drill size used for this specific calculation.                 | 10.0           |
| `RPMUsed`           | Number    | RPM used for this specific calculation.                        | 1800           |
| `FeedRateUsed`      | Number    | Feed rate used for this specific calculation.                  | 80             |
| `BaseCuttingTime`   | Number    | Calculated base cutting time.                                  | 15.2           |
| `SetupTime`         | Number    | Setup time applied.                                            | 5.0            |
| `GrindingTime`      | Number    | Grinding time applied.                                         | 2.5            |
| `InspectionTime`    | Number    | Inspection time applied.                                       | 1.0            |
| `TotalStandardTime` | Number    | Final calculated total standard time for the operation/feature.| 23.7           |

## 4. Relationships

- **`JobDetails` to `CalculationResults` (One-to-Many):** One job or part can have multiple calculation results (e.g., if different parameters are tested or if calculations are performed for individual features within a job).

## 5. Data Normalization Considerations

The proposed schema aims for a balance between normalization and ease of use within Power Apps. The `TimeStudyData` table is designed to be a lookup table, reducing redundancy. `JobDetails` and `CalculationResults` are separated to maintain a clear history of calculations per job.

## 6. Future Considerations (SharePoint List Migration)

When migrating to SharePoint Lists, each table described above would correspond to a separate SharePoint List. Lookups between lists would be configured to maintain relationships. This approach provides versioning, access control, and easier integration with Power Automate for historical logging and reporting.

