var e=`---
title: .NET distance calculator
summary: Find the nearest coordinates with the Haversine formula in C#, and set up the Google Maps Compute Route Matrix API for road distances.
category: C# and .NET
order: 40
---

# .NET distance calculator

This article shows a C# program that finds the 3 nearest coordinates to a point with the Haversine formula. It also shows how to set up the Google Maps Compute Route Matrix API when you need road distances.

## Before you start

| Requirement | Used for |
| --- | --- |
| .NET with \`System.Text.Json\` | The Haversine program |
| A Google account | The Google Maps API key |
| A billing account with a valid credit card | Google Maps APIs. Billing is mandatory, also for tests and free-tier usage. |

## Choose a distance method

The Haversine formula gives a rough estimate of the distance between 2 points on the globe from their latitude and longitude. It does not include the physical terrain or the curves of the land. For road distances and travel routes, use a routing API.

| Name | Link |
| --- | --- |
| Azure Maps Route Matrix | [Post Route Matrix](https://learn.microsoft.com/en-us/rest/api/maps/route/post-route-matrix?view=rest-maps-2025-01-01&tabs=HTTP) |
| Azure Maps Get Search Fuzzy | [Get Search Fuzzy](https://learn.microsoft.com/en-us/rest/api/maps/search/get-search-fuzzy?view=rest-maps-1.0&tabs=HTTP) |
| Azure Maps Get Search Address | [Get Search Address](https://learn.microsoft.com/en-us/rest/api/maps/search/get-search-address?view=rest-maps-1.0&tabs=HTTP) |
| Google Maps Compute Route Matrix | [Compute Route Matrix](https://developers.google.com/maps/documentation/routes/compute-route-matrix-over) |
| Google Maps Text Search | [Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search) |

> **NOTE:** Dated (checked November 2026): The Azure Maps Search links use the legacy API version 1.0. Use the current Search API version (2025-01-01), for example Get Geocoding for address search.

## Create a Google Maps API key

To use the Google Maps Compute Route Matrix API for your organization, set up a project with your Google account.

1. Create a Google Cloud project. You can do this with only a Google account.
   1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
   2. Click **Select a project**, then click **New Project**.
   3. Type a name (for example \`RouteMatrixProject\`) and click **Create**.
2. Enable billing. Google Maps APIs need billing, also for free-tier usage.
   1. In the Cloud Console, go to **Billing**.
   2. Set up a billing account. You need a valid credit card.
   3. Link the billing account to your project.
3. Enable the **Routes API**. Compute Route Matrix needs it.
   1. Go to **APIs & Services > Library**.
   2. Search for **Routes API** and click **Enable**.
4. Create an API key.
   1. Go to **APIs & Services > Credentials**.
   2. Click **Create Credentials** and select **API Key**.
   3. Copy the key. Your application uses this key.
5. Secure the API key to prevent misuse.
   1. In the **Credentials** section, click your API key.
   2. Under **Application restrictions**, select **HTTP referrers (websites)** for web applications or **IP addresses** for backend services.
   3. Under **API restrictions**, restrict the key to the **Routes API**.

## Call the Compute Route Matrix API

Send the key with the request, as a query parameter:

\`\`\`http
POST https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix
?key=YOUR_API_KEY
\`\`\`

Make sure that the request body contains the origin and destination details in the correct format.

This \`curl\` example sends the key in the \`X-Goog-Api-Key\` header. It calculates the driving distance from Brakpan to Johannesburg. Replace \`YOUR_API_KEY\` with your key.

\`\`\`bash
curl -X POST \\
-H "Content-Type: application/json" \\
-H "X-Goog-Api-Key: YOUR_API_KEY" \\
-d '{
    "origins": [{"waypoint": {"location": {"latLng": {"latitude": -26.236, "longitude": 28.369}}}}],
    "destinations": [{"waypoint": {"location": {"latLng": {"latitude": -26.204, "longitude": 28.047}}}}],
    "travelMode": "DRIVE"
}' \\
"https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
\`\`\`

You can also use Postman or a different HTTP client to test the API interactively.

## Set usage limits

Google offers $200 of free usage each month. This is enough for thousands of requests.

> **NOTE:** Dated (checked November 2026): Since March 2025, Google Maps Platform does not give a $200 monthly credit. Each API SKU now has its own free monthly usage limit. Refer to the Google Maps Platform pricing page for the current limits.

To prevent unexpected costs, set quotas and budget alerts, and monitor the usage in the Cloud Console.

1. Set quotas.
   1. Go to [Google Cloud Console Quotas](https://console.cloud.google.com/iam-admin/quotas).
   2. Filter by **Routes API**.
   3. Click the quota that you want to limit (for example \`Route Matrix requests\`).
   4. Click **Edit Quotas** and set a lower daily limit (for example 100 requests each day).
2. Set budget alerts.
   1. Go to [Billing > Budgets & alerts](https://console.cloud.google.com/billing).
   2. Create a budget for your project (for example $10 each month).
   3. Set email alerts at thresholds such as 50%, 90%, and 100%.

## Code

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

public class Program
{
    public class Coordinate
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
    
    // Helper class to store coordinate and its calculated distance
    private class CoordinateDistance
    {
        public Coordinate Coordinate { get; set; }
        public double Distance { get; set; }
    }

    private static readonly List<Coordinate> _predefinedCoordinates = new List<Coordinate>
    {
        new Coordinate { Latitude = -26.2041, Longitude = 28.0473 }, // Johannesburg
        new Coordinate { Latitude = -33.8688, Longitude = 151.2093 },// Sydney
        new Coordinate { Latitude = 40.7128, Longitude = -74.0060 }, // New York
        new Coordinate { Latitude = -25.771394283754905, Longitude = 28.235580364439038 }, // Brooklyn Mall
        new Coordinate { Latitude = 35.6895, Longitude = 139.6917 }, // Tokyo
        new Coordinate { Latitude = 48.8566, Longitude = 2.3522 },    // Paris
        new Coordinate { Latitude = 55.7558, Longitude = 37.6173 },    // Moscow
        new Coordinate { Latitude = -25.78263134020646, Longitude = 28.275175392408805 }   // Menlyn Park Shopping Centre
    };

    /// <summary>
    /// Calculates the distance between two sets of coordinates using the Haversine formula.
    /// </summary>
    /// <param name="lat1">Latitude of the first point.</param>
    /// <param name="lon1">Longitude of the first point.</param>
    /// <param name="lat2">Latitude of the second point.</param>
    /// <param name="lon2">Longitude of the second point.</param>
    /// <returns>Distance in kilometers, or -1 if an error occurs.</returns>
    private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        try
        {
            const double R = 6371; // Earth's radius in kilometers

            double dLat = ToRadians(lat2 - lat1);
            double dLon = ToRadians(lon2 - lon1);

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c; // Distance in kilometers
        }
        catch (ArithmeticException ex)
        {
            Console.Error.WriteLine($"Mathematical error during Haversine calculation: {ex.Message}");
            return -1; // Indicate an error
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"An unexpected error occurred during Haversine calculation: {ex.Message}");
            return -1; // Indicate an error
        }
    }

    /// <summary>
    /// Converts an angle from degrees to radians.
    /// </summary>
    /// <param name="angle">The angle in degrees.</param>
    /// <returns>The angle in radians.</returns>
    private static double ToRadians(double angle)
    {
        return Math.PI * angle / 180.0;
    }

    public static void Main()
    {
        // Define the request coordinate
        Coordinate requestCoordinate = new Coordinate() { Latitude = -25.754511453940673, Longitude = 28.181179918201046 }; // Tshwane Mail Centre

        // Basic validation for the request coordinate
        if (requestCoordinate.Latitude < -90 || requestCoordinate.Latitude > 90 ||
            requestCoordinate.Longitude < -180 || requestCoordinate.Longitude > 180)
        {
            Console.Error.WriteLine("Error: Invalid request coordinate provided. Latitude must be between -90 and 90, and Longitude between -180 and 180.");
            return;
        }

        double targetLatitude = requestCoordinate.Latitude;
        double targetLongitude = requestCoordinate.Longitude;

        // Use a list to store the results of the LINQ query
        List<CoordinateDistance> nearestCoordinatesWithDistance = new List<CoordinateDistance>();

        try
        {
            // Select, order, and take the top 3 nearest coordinates
            nearestCoordinatesWithDistance = _predefinedCoordinates
                .Select(coord => new CoordinateDistance
                {
                    Coordinate = coord,
                    Distance = CalculateHaversineDistance(targetLatitude, targetLongitude, coord.Latitude, coord.Longitude)
                })
                .Where(item => item.Distance != -1) // Filter out items where distance calculation failed
                .OrderBy(item => item.Distance)
                .Take(3)
                .ToList();

            // Extract just the Coordinate objects for serialization
            List<Coordinate> nearestCoordinates = nearestCoordinatesWithDistance
                .Select(item => item.Coordinate)
                .ToList();

            // Serialize and print the result
            JsonSerializerOptions options = new JsonSerializerOptions { WriteIndented = true };
            string jsonOutput = JsonSerializer.Serialize(nearestCoordinates, options);
            Console.WriteLine(jsonOutput);
        }
        catch (InvalidOperationException ex)
        {
            Console.Error.WriteLine($"Error during LINQ operations: {ex.Message}");
        }
        catch (JsonException ex)
        {
            Console.Error.WriteLine($"Error serializing coordinates to JSON: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"An unexpected error occurred in Main: {ex.Message}");
        }
    }
}
\`\`\`

## How to use it

1. Put your locations in \`_predefinedCoordinates\`.
2. Set \`requestCoordinate\` in \`Main\` to the point that you want to search from. The sample uses the Tshwane Mail Centre.
3. Run the program.

**Result:** The program prints the 3 nearest coordinates as indented JSON. For the sample point, these are Brooklyn Mall, Menlyn Park Shopping Centre, and Johannesburg.

## How it works

- \`CalculateHaversineDistance\` uses an Earth radius of 6371 km and returns the distance in kilometers.
- If the calculation fails, the method returns \`-1\`. The LINQ query removes these items before it sorts the list.
- \`Main\` stops with an error if the latitude is not between -90 and 90 or the longitude is not between -180 and 180.
`;export{e as default};