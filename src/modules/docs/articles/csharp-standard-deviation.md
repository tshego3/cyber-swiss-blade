---
title: C# standard deviation
summary: A C# class that calculates the sample and the population standard deviation of a list of double values.
category: C# and .NET
order: 30
gist: f1b338ec5df3006c662e8694cb6c14db
---

# C# standard deviation

The standard deviation measures the amount of variation (dispersion) in a set of values. Use this class to calculate the standard deviation of a sample or of a full population.

## Before you start

- Add `using System;`, `using System.Collections.Generic;`, and `using System.Linq;` to the file. The class uses `Math`, `List<double>`, and the LINQ methods `Average`, `Select`, `Sum`, and `Count`.

## Code

```csharp
public class StandardDeviation
{
    /// <summary>
    /// The standard deviation is a measure of the amount of variation or dispersion of a set of values. This returns the standard deviation sample set.
    /// </summary>
    /// <param name="doubleList"></param>
    /// <returns></returns>
    public double GetStandardDeviationSample(List<double> doubleList)
    {
        double sum = new double();
        double average = doubleList.Average();
        foreach (double value in doubleList)
        {
            sum += Math.Pow(value - average, 2);
        }
        return Math.Sqrt(sum / (doubleList.Count() - 1));
    }
    /// <summary>
    /// The standard deviation is a measure of the amount of variation or dispersion of a set of values. This returns the standard deviation population set.
    /// </summary>
    /// <param name="doubleList"></param>
    /// <returns></returns>
    public double GetStandardDeviationPopulation(List<double> doubleList)
    {
        double average = doubleList.Average();
        double sumOfSquaresOfDifferences = doubleList.Select(val => (val - average) * (val - average)).Sum();
        return Math.Sqrt(sumOfSquaresOfDifferences / doubleList.Count());
    }
}
```

## How to use it

```csharp
var values = new List<double> { 2, 4, 4, 4, 5, 5, 7, 9 };
var calculator = new StandardDeviation();

double sample = calculator.GetStandardDeviationSample(values);
double population = calculator.GetStandardDeviationPopulation(values);
```

## How it works

| Method | Divides the sum of squared differences by | Use it when |
| --- | --- | --- |
| `GetStandardDeviationSample` | `Count - 1` | The values are a sample of a larger set. |
| `GetStandardDeviationPopulation` | `Count` | The values are the full population. |
