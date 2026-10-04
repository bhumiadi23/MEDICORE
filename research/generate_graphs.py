import pandas as pd
import matplotlib.pyplot as plt
import os

results_dir = 'research/results'
graphs_dir = 'research/results/graphs'
os.makedirs(graphs_dir, exist_ok=True)

# 1. Performance / Gas Chart
perf_df = pd.read_csv(f'{results_dir}/performance_results.csv')
plt.figure(figsize=(8,5))
perf_df.dropna(subset=['GasUsed']).plot(kind='bar', x='Operation', y='GasUsed', legend=False, color='skyblue')
plt.title('Gas Consumption per Operation')
plt.ylabel('Gas Used (Wei)')
plt.tight_layout()
plt.savefig(f'{graphs_dir}/gas_consumption.png')
plt.close()

# 2. Authorization Chart
auth_df = pd.read_csv(f'{results_dir}/authorization_results.csv')
plt.figure(figsize=(6,4))
plt.bar(['Passed', 'Rejected'], [auth_df['Passed'].iloc[0], auth_df['Rejected'].iloc[0]], color=['green', 'red'])
plt.title('Role-Based Authorization Constraints')
plt.ylabel('Transaction Count')
plt.tight_layout()
plt.savefig(f'{graphs_dir}/authorization_constraints.png')
plt.close()

# 3. Quantity Conservation
quant_df = pd.read_csv(f'{results_dir}/quantity_results.csv')
plt.figure(figsize=(6,4))
row = quant_df.iloc[0]
plt.bar(['Initial', 'Transferred', 'Remaining'], [row['Initial'], row['Transferred'], row['Remaining']], color=['blue', 'orange', 'green'])
plt.title('Quantity Conservation Verification')
plt.ylabel('Units')
plt.tight_layout()
plt.savefig(f'{graphs_dir}/quantity_conservation.png')
plt.close()

# 4. Verification Latency
latency = perf_df.loc[perf_df['Operation'] == 'verifyDrug', 'Latency_ms'].iloc[0]
plt.figure(figsize=(4,4))
plt.bar(['verifyDrug'], [latency], color='purple')
plt.title('QR Verification Latency')
plt.ylabel('Latency (ms)')
plt.tight_layout()
plt.savefig(f'{graphs_dir}/verification_latency.png')
plt.close()

print("Graphs generated successfully.")
