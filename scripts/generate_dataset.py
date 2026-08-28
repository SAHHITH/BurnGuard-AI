import os
import numpy as np
import pandas as pd

def generate_synthetic_burnin_data(
    num_components: int = 2500,
    num_lots: int = 10,
    random_seed: int = 42,
    output_path: str = "data/raw/burnin_dataset.csv"
) -> pd.DataFrame:
    """
    Generates a realistic synthetic burn-in screening dataset for electronic components.
    
    Includes:
    - Multiple manufacturing lots with lot-to-lot baseline variations
    - Normal components with expected noise and mild thermal acceleration
    - Slowly drifting components (latent degradation)
    - Rapidly drifting components (severe early failure)
    - Statistical anomalies (atypical starting baseline or jump)
    - Controlled ground truth labels for validation/evaluation: NORMAL, DRIFTING, ANOMALOUS, HIGH_RISK
    """
    np.random.seed(random_seed)
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Define lot characteristics (lot baseline leakage current in uA and lot std)
    lot_ids = [f"LOT_{i+1:02d}" for i in range(num_lots)]
    lot_baselines = np.random.uniform(8.0, 15.0, size=num_lots)
    lot_stds = np.random.uniform(0.5, 1.5, size=num_lots)
    lot_dict = {lot: {"base": base, "std": std} for lot, base, std in zip(lot_ids, lot_baselines, lot_stds)}
    
    components = []
    
    for i in range(num_components):
        comp_id = f"C{i+1:05d}"
        lot = np.random.choice(lot_ids)
        lot_base = lot_dict[lot]["base"]
        lot_std = lot_dict[lot]["std"]
        
        # Temperature condition (typically 85C, 105C, 125C, 150C burn-in temp)
        temp = float(np.random.choice([85, 105, 125, 150], p=[0.1, 0.2, 0.6, 0.1]))
        temp_factor = 1.0 + (temp - 125.0) * 0.005  # slight temperature adjustment
        
        # Assign behavior profile
        # 80% Normal, 8% Slow Drift, 5% Rapid Drift, 4% Baseline Anomaly, 3% High Risk Compound
        profile_choice = np.random.choice(
            ["NORMAL", "DRIFTING_SLOW", "DRIFTING_RAPID", "ANOMALY_BASELINE", "HIGH_RISK"],
            p=[0.78, 0.09, 0.05, 0.04, 0.04]
        )
        
        # Base 0h value
        if profile_choice == "ANOMALY_BASELINE":
            # Statistically abnormal baseline compared to lot
            val_0h = lot_base + np.random.choice([-1, 1]) * np.random.uniform(3.5, 6.0) * lot_std
        else:
            val_0h = np.random.normal(lot_base, lot_std)
            
        val_0h = max(1.0, val_0h * temp_factor) # Ensure positive realistic current in uA
        
        # Simulate time trajectory: 0h -> 24h -> 96h -> 168h
        if profile_choice == "NORMAL":
            # Normal thermal stabilization and minimal linear drift (0.1 to 0.4 uA / 24h)
            slope = np.random.uniform(0.005, 0.03)
            noise_24 = np.random.normal(0, 0.3)
            noise_96 = np.random.normal(0, 0.5)
            noise_168 = np.random.normal(0, 0.7)
            
            val_24h = val_0h + slope * 24 + noise_24
            val_96h = val_0h + slope * 96 + noise_96
            val_168h = val_0h + slope * 168 + noise_168
            ground_truth = "NORMAL"
            
        elif profile_choice == "DRIFTING_SLOW":
            # Slow exponential/quadratic degradation
            alpha = np.random.uniform(0.04, 0.08)
            val_24h = val_0h + alpha * 24 + np.random.normal(0, 0.4)
            val_96h = val_0h + alpha * 96 + 0.0005 * (96**2) + np.random.normal(0, 0.8)
            val_168h = val_0h + alpha * 168 + 0.001 * (168**2) + np.random.normal(0, 1.2)
            ground_truth = "DRIFTING"
            
        elif profile_choice == "DRIFTING_RAPID":
            # Rapid early degradation starting sharply between 0h and 24h
            alpha = np.random.uniform(0.25, 0.6)
            val_24h = val_0h + alpha * 24 + np.random.normal(0, 0.5)
            val_96h = val_24h + alpha * 72 * 1.5 + np.random.normal(0, 1.0)
            val_168h = val_96h + alpha * 72 * 2.2 + np.random.normal(0, 1.5)
            ground_truth = "HIGH_RISK"
            
        elif profile_choice == "ANOMALY_BASELINE":
            # Outlier starting point, normal drift slope
            slope = np.random.uniform(0.01, 0.05)
            val_24h = val_0h + slope * 24 + np.random.normal(0, 0.3)
            val_96h = val_0h + slope * 96 + np.random.normal(0, 0.5)
            val_168h = val_0h + slope * 168 + np.random.normal(0, 0.7)
            ground_truth = "ANOMALOUS"
            
        else: # HIGH_RISK
            # Compound defect: abnormal baseline AND accelerating drift
            val_0h = val_0h + 2.5 * lot_std
            val_24h = val_0h + np.random.uniform(8.0, 15.0)
            val_96h = val_24h + np.random.uniform(15.0, 30.0)
            val_168h = val_96h + np.random.uniform(25.0, 50.0)
            ground_truth = "HIGH_RISK"

        # Ensure non-negative and round to 2 decimals
        val_0h = round(max(0.5, val_0h), 2)
        val_24h = round(max(val_0h * 0.8, val_24h), 2)
        val_96h = round(max(val_24h * 0.8, val_96h), 2)
        val_168h = round(max(val_96h * 0.8, val_168h), 2)
        
        components.append({
            "component_id": comp_id,
            "lot_id": lot,
            "value_0h": val_0h,
            "value_24h": val_24h,
            "value_96h": val_96h,
            "value_168h": val_168h,
            "temperature": temp,
            "ground_truth_status": ground_truth
        })
        
    df = pd.DataFrame(components)
    df.to_csv(output_path, index=False)
    print(f"Successfully generated synthetic dataset with {len(df)} records at '{output_path}'.")
    return df

if __name__ == "__main__":
    generate_synthetic_burnin_data()
