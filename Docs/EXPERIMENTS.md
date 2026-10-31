# FlowPilot — Experiments & Evaluation

> **Purpose:** Document how FlowPilot's financial forecasting, risk analysis, payment optimization, simulation, and copilot capabilities are evaluated.
>
> **Status:** Living document  
> **Project:** FlowPilot  
> **Backend:** FastAPI + Python  
> **Database:** PostgreSQL  
> **Testing:** Pytest  
> **Evaluation principle:** Every performance or correctness claim should be supported by a reproducible experiment and recorded evidence.

---

## 1. Why We Run Experiments

FlowPilot turns financial records into forecasts, risk findings, and proposed payment schedules. Because these outputs can influence business decisions, correctness and safety matter as much as response speed.

Our experiments aim to answer five questions:

1. **Forecasting:** Are projected daily balances calculated correctly?
2. **Risk analysis:** Does the system identify negative balances and reserve shortfalls?
3. **Simulation:** Are results reproducible under controlled inputs, and do they behave consistently with deterministic calculations?
4. **Payment optimization:** Do proposed schedules respect the supported financial constraints?
5. **Copilot:** Are explanations grounded in available financial data, useful, and consistent with tool results?

The objective is not merely to show that the application runs. It is to measure whether its outputs are dependable.

## 2. Experiment Status

The following labels distinguish evidence from plans.

| Status | Meaning |
|---|---|
| `VERIFIED` | The corresponding test or behavior has been observed and recorded |
| `PLANNED` | The experiment is designed but has not been confirmed as executed |
| `IN PROGRESS` | The experiment is currently being run |
| `BLOCKED` | The experiment cannot proceed because a dependency or required dataset is unavailable |
| `NEEDS REVIEW` | A result exists but needs further validation |

### Existing Test Evidence

The project's previously reported automated test run collected **13 tests, all passing**. The test areas included:

- Forecast calculations and daily balance behavior.
- Forecast horizon validation.
- Main API routes, including health and documentation.
- Monte Carlo simulation reproducibility.
- Consistency between zero-delay simulation and deterministic risk behavior.
- Validation of simulation inputs.
- Critical cash and reserve-warning behavior in risk analysis.
- Handling of `None` reserve-shortfall values.

This is evidence that the covered tests passed in that run. It is **not** evidence of production accuracy, real-world forecasting performance, or large-scale throughput.

Re-run the current repository's test suite before using this result as a current status claim.

## 3. Experimental Environment

Record the environment for each experiment to make results comparable.

| Parameter | Value to record |
|---|---|
| Git commit | Commit SHA |
| Operating system | Windows, Linux, or macOS and version |
| Python version | Exact interpreter version |
| Dependency versions | Lockfile or environment snapshot |
| Database | PostgreSQL version and configuration |
| Dataset | Name, source, size, and date range |
| Forecast horizon | Number of days |
| Simulation count | Number of Monte Carlo trials |
| Random seed | Seed used, where applicable |
| Execution time | Wall-clock duration |
| Test command | Exact command used |
| Result | Pass, fail, or inconclusive |

Avoid including database passwords, API tokens, private financial records, or other secrets in experiment logs.

## 4. Experiment 1 — Forecast Arithmetic Correctness

**Status:** Existing automated coverage reported; broader experiment planned.

### Objective

Verify that FlowPilot calculates daily cash balances correctly and avoids counting the same financial movement more than once.

### Hypothesis

For each currency, the closing balance for a day should equal the opening balance plus expected inflows minus expected outflows.

### Procedure

1. Prepare a controlled starting balance.
2. Supply known inflows and outflows for several dates.
3. Generate a forecast.
4. Independently calculate the expected balances.
5. Compare the calculated results with the API output.
6. Verify that each day's closing balance becomes the next day's opening balance.
7. Test an empty-activity period and a period containing multiple movements.

### Example test fixture

| Day | Opening balance | Inflow | Outflow | Expected closing balance |
|---|---:|---:|---:|---:|
| 1 | 10,000.00 | 2,000.00 | 500.00 | 11,500.00 |
| 2 | 11,500.00 | 0.00 | 1,500.00 | 10,000.00 |
| 3 | 10,000.00 | 750.00 | 250.00 | 10,500.00 |

*These are illustrative inputs for a proposed experiment, not measured output from a live FlowPilot run.*

### Evaluation criteria

- Every closing balance matches the independently calculated result within the defined decimal policy.
- Opening and closing balances remain continuous between consecutive days.
- A settled movement is not counted twice.
- Invalid forecast horizons are rejected.
- Currency balances remain separate unless explicit conversion is supported.

### Evidence to record

- Input fixture.
- API request and response.
- Expected versus actual balances.
- Test output and commit SHA.

## 5. Experiment 2 — Liquidity Risk Detection

**Status:** Existing automated coverage reported; broader experiment planned.

### Objective

Evaluate whether the risk-analysis system correctly identifies negative projected cash and reserve shortfalls.

### Hypothesis

Given a forecast and configured reserve threshold, risk analysis should identify the dates and currencies that breach the relevant financial constraints.

### Test scenarios

| Scenario | Expected behavior |
|---|---|
| Healthy balance with no reserve breach | No critical liquidity finding |
| Closing balance below zero | Negative-cash risk detected |
| Positive balance below minimum reserve | Reserve-shortfall warning detected |
| Balance exactly at the configured threshold | Behavior matches the defined boundary rule |
| Reserve shortfall is `None` | Handled without an exception |
| Several consecutive breach days | Findings reflect the affected dates according to the API contract |

### Procedure

1. Create controlled balances and payment movements.
2. Generate the corresponding forecast.
3. Run risk analysis against the same inputs.
4. Compare the results with independently calculated threshold checks.
5. Repeat the test at the exact boundary and immediately above and below it.

### Evaluation criteria

- The system detects every risk covered by the test specification.
- It does not generate a false positive for a healthy fixture.
- Risk severity and explanatory fields match the configured rules.
- Missing optional values do not cause unexpected failures.
- Currency-specific reserve checks are performed consistently.

**Important:** The absence of a detected risk does not prove that a business is financially safe. It only means that no risk was detected under the evaluated rules and inputs.

## 6. Experiment 3 — Monte Carlo Simulation

**Status:** Existing automated coverage reported; statistical validation planned.

### Objective

Check whether the simulation behaves reproducibly and produces sensible risk estimates under controlled assumptions.

### Hypothesis

When the same inputs and random seed are used, the simulation should produce reproducible results. Under zero delay and matching assumptions, the simulated result should agree with the deterministic baseline within the implementation's defined comparison rules.

### Procedure

1. Choose a fixed starting balance and financial schedule.
2. Run the simulation with a fixed random seed.
3. Repeat with the same inputs and seed.
4. Compare the resulting summaries.
5. Run with zero delay and compare against the deterministic calculation.
6. Test invalid simulation counts and invalid delay parameters.
7. Increase the simulation count to examine whether estimated probabilities stabilize.

### Evaluation criteria

- Identical seeded runs produce the expected reproducibility.
- Zero-delay behavior agrees with the deterministic baseline where the assumptions are equivalent.
- Invalid inputs are rejected clearly.
- Estimated risk probabilities remain within valid bounds.
- Larger runs are evaluated for stability rather than assumed to be more accurate automatically.

### Proposed convergence experiment

Run the same controlled scenario with increasing trial counts, for example:

- 100 simulations.
- 1,000 simulations.
- 10,000 simulations.

Record the estimated probability of a negative balance, runtime, and variation across independent seeds.

These counts are proposed experiment settings, not completed benchmark results.

### Interpretation

A Monte Carlo estimate depends on its probability distributions, delay assumptions, and input quality. Reproducibility alone does not establish that those assumptions accurately represent real customer payment behavior.

## 7. Experiment 4 — Payment Schedule Optimization

**Status:** Planned for systematic evaluation.

### Objective

Determine whether recommended payment schedules satisfy the configured constraints and improve the chosen financial objective.

### Hypothesis

A recommendation should be accepted as valid only if it passes schedule validation. If no safe schedule exists, the system should report that limitation rather than presenting an unsafe schedule as safe.

### Procedure

1. Create a baseline of accounts, invoices, obligations, and due dates.
2. Define the applicable minimum reserves and payment priorities.
3. Generate the original cash-flow forecast.
4. Run the optimizer.
5. Validate every proposed payment date against supported constraints.
6. Recalculate the forecast using the proposed schedule.
7. Compare the original and proposed schedules.
8. Record both improvements and constraint violations.

### Metrics

| Metric | Definition |
|---|---|
| Reserve breach count | Number of evaluated dates violating the reserve rule |
| Negative-balance days | Number of days with projected cash below zero |
| Maximum reserve shortfall | Largest amount below the configured reserve |
| Overdue obligations | Obligations unpaid past their applicable due dates |
| Schedule validation | Whether the result passes supported safety constraints |
| Runtime | Time taken to produce and validate the result |

### Evaluation criteria

- Unsafe schedules are not marked safe.
- Every recommendation has a clear explanation.
- Constraints are checked against the proposed schedule, not just the original forecast.
- The original schedule remains available for comparison.
- The optimizer's limitations are documented.

### Important interpretation

A schedule with fewer reserve breaches is not necessarily better if it causes contractual late fees, missed payroll, or other unacceptable consequences. Evaluation should include the business constraints represented by the system.

FlowPilot's current optimizer should be described according to its actual algorithm. Unless a formal optimization guarantee has been established, do not claim that it always finds a globally optimal solution.

## 8. Experiment 5 — Scenario Isolation

**Status:** Planned.

### Objective

Ensure hypothetical financial changes affect scenario results without modifying actual financial records.

### Hypothesis

Running a scenario should not change account balances, invoice status, or obligation status unless the user separately performs an authorized operation that changes those records.

### Procedure

1. Record the source financial state.
2. Save a scenario that changes an expected receipt or payment date.
3. Preview or calculate the scenario.
4. Read the source records again.
5. Compare source records before and after the calculation.
6. Repeat with multiple scenarios derived from the same starting state.

### Evaluation criteria

- Source records remain unchanged by a preview operation.
- Each scenario's results correspond to its own inputs.
- One scenario does not contaminate another scenario's results.
- Invalid scenario parameters are rejected.
- Repeated calculations are reproducible when the inputs and assumptions are identical.

## 9. Experiment 6 — API Reliability and Validation

**Status:** Existing main-route and validation coverage reported; broader API testing planned.

### Objective

Measure the reliability of the API contracts that support financial calculations and the dashboard.

### Procedure

Test the health endpoint, documentation endpoint, company resources, forecasting, risk analysis, optimization, scenarios, simulation, alerts, and copilot routes as supported by the current implementation.

### Evaluation criteria

- Valid requests return the documented response shape.
- Invalid inputs produce controlled client errors instead of unhandled server exceptions.
- Missing or inaccessible resources are handled consistently.
- Database failures do not expose credentials or sensitive internal details.
- Company-level authorization is checked on all applicable routes.

### Commands

From the backend directory, with the project's Python environment activated:

```powershell
python -m pytest -v
```

Start the API using the project's configured development command, if appropriate:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Then inspect the API documentation at:

```text
http://localhost:8000/docs
```

**Port note:** Check whether port `8000` is already occupied before starting the API. FlowPilot and other local projects may use different ports. Do not stop or replace unrelated containers merely to run this experiment.

## 10. Experiment 7 — AI Copilot Quality

**Status:** Planned; evaluate only the copilot capabilities available in the current build.

### Objective

Assess whether the copilot gives relevant, grounded, and safe explanations of financial results.

### Test categories

| Category | Test |
|---|---|
| Grounding | Ask about a value present in the supplied company data |
| Numerical consistency | Compare a response's figures with the API output |
| Missing information | Ask a question that cannot be answered from available records |
| Tool behavior | Verify that tool calls use valid parameters and handle errors |
| Company isolation | Ensure data from another company is not disclosed |
| Scenario reasoning | Ask for an explanation of an existing scenario result |
| Streaming | Verify partial responses and completion behavior where supported |

### Evaluation rubric

Score each response using a documented scale, such as 0–2 per criterion:

- **Grounded:** Claims are supported by available data.
- **Numerically correct:** Figures agree with source calculations.
- **Relevant:** The response addresses the question.
- **Transparent:** Missing data and uncertainty are stated.
- **Safe:** The response does not claim to have executed a payment or changed records when it has not.

Record the individual scores and examples. Do not report a quality percentage until a defined test set has been evaluated.

## 11. Experiment 8 — Performance and Scalability

**Status:** Planned.

### Objective

Measure response latency and resource usage under representative workloads.

### Workloads

- Retrieve account data.
- Generate forecasts over different horizons.
- Evaluate risk across multiple forecast days.
- Run simulations with increasing trial counts.
- Generate and validate payment schedules.
- Load saved scenarios and copilot conversations.

### Metrics

| Metric | Meaning |
|---|---|
| p50 latency | Median request duration |
| p95 latency | Duration at the 95th percentile |
| Throughput | Completed requests per second |
| Error rate | Failed requests divided by total requests |
| Memory usage | Peak memory during the experiment |
| CPU usage | CPU consumption during the workload |
| Database latency | Time spent waiting on database operations |

### Procedure

1. Record the environment and commit SHA.
2. Run a low-load baseline.
3. Increase request concurrency gradually.
4. Record latency, errors, and resource usage.
5. Repeat the test to identify unstable results.
6. Compare results only when the environment and inputs are sufficiently similar.

No latency target or throughput result is claimed here. Set acceptance thresholds after measuring the current application and establishing the intended workload.

## 12. Experiment Results Log

Add a row whenever an experiment is executed.

| ID | Experiment | Status | Commit SHA | Dataset / fixture | Result | Evidence |
|---|---|---|---|---|---|---|
| E-001 | Forecast unit tests | Previously reported passing | Reconfirm current SHA | Automated fixtures | 13-test suite previously passed overall | Pytest output |
| E-002 | Risk-analysis unit tests | Previously reported passing | Reconfirm current SHA | Automated fixtures | Covered cases passed in the reported run | Pytest output |
| E-003 | Monte Carlo unit tests | Previously reported passing | Reconfirm current SHA | Seeded test fixtures | Reproducibility and zero-delay consistency covered | Pytest output |
| E-004 | Forecast arithmetic fixture | Planned | — | Three-day illustrative fixture | Not yet recorded | — |
| E-005 | Risk boundary evaluation | Planned | — | Threshold fixtures | Not yet recorded | — |
| E-006 | Simulation convergence | Planned | — | Fixed scenario and multiple seeds | Not yet recorded | — |
| E-007 | Optimization constraint evaluation | Planned | — | Controlled obligations | Not yet recorded | — |
| E-008 | Scenario isolation | Planned | — | Before/after source-state comparison | Not yet recorded | — |
| E-009 | Copilot quality evaluation | Planned | — | Curated question set | Not yet recorded | — |
| E-010 | API performance baseline | Planned | — | Representative workload | Not yet recorded | — |

Update statuses and evidence only after running the corresponding experiment. A passing unit test should not be interpreted as a completed benchmark or a real-world accuracy evaluation.

## 13. Reproducibility Checklist

Before publishing an experiment result, record:

- [ ] Commit SHA and working-tree state.
- [ ] Python and dependency versions.
- [ ] Database version and relevant configuration.
- [ ] Sanitized input fixtures or dataset reference.
- [ ] Exact test or benchmark command.
- [ ] Random seed and simulation count, where relevant.
- [ ] Expected result and evaluation rule.
- [ ] Actual output and execution time.
- [ ] Failures, limitations, and known confounding factors.
- [ ] Evidence that can be reproduced without exposing secrets or customer data.

## 14. Known Limitations

Experiments should explicitly account for these limitations when they apply:

1. Synthetic fixtures do not prove real-world forecasting accuracy.
2. Simulation results depend on the assumptions and distributions used.
3. A valid mathematical schedule may still violate a business or contractual requirement that was not modeled.
4. Currency balances cannot be combined correctly without explicit conversion rules.
5. Copilot output quality must be measured against source data and tool results.
6. A passing test suite does not establish production readiness, security, or scalability.
7. Results may change as the code, database schema, financial rules, or model configuration changes.

## 15. Future Experiments

Potential extensions include:

- Backtesting forecasts against historical cash balances.
- Comparing forecast errors across multiple horizons.
- Measuring risk-detection precision and recall against labeled cases.
- Comparing optimizer outcomes against a simple baseline schedule.
- Evaluating payment delays using empirical distributions when reliable data is available.
- Testing database migrations against a copy of representative data.
- Measuring authorization and tenant-isolation behavior.
- Comparing copilot responses across a fixed regression dataset.
- Running load tests against a documented hardware and software configuration.

For forecasting backtests, consider recording mean absolute error (MAE) and weighted absolute percentage error (WAPE), while handling zero or near-zero actual balances carefully. Use only historical data that would have been available at the forecast creation time to avoid leakage.

---

## 16. Conclusion

FlowPilot's experiments are intended to validate the integrity of its financial calculations before measuring more advanced properties such as forecast accuracy, optimization quality, and response performance.

The immediate priority is to maintain a passing automated test suite, add deterministic fixtures for key financial rules, and record reproducible evidence for each broader experiment.

**Guiding principle:** Never present an untested hypothesis as a result, a simulation estimate as a guarantee, or a recommendation as an executed financial action.
