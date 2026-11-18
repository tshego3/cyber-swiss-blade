---
title: Essential algorithms with C#
summary: C# implementations and sample output for search, sort, recursion, graph traversal, and shortest-path algorithms that all developers must know.
category: C# and .NET
order: 20
gist: 8110ed8e6b60cb31f05a4bd131be8734
---

# Essential algorithms with C#

This article collects fundamental algorithms for developers. Each algorithm has a short definition, a C# implementation, and sample output that shows how it works.

## Searching algorithms

### Linear search

Linear search examines each element of an array in sequence. It stops when it finds the target value or reaches the end of the array.

```csharp
using System;

class Program
{
    static int LinearSearch(int[] arr, int target)
    {
        for (int i = 0; i < arr.Length; i++)
            if (arr[i] == target)
                return i;
        return -1;
    }

    static void Main()
    {
        int[] data = { 4, 2, 7, 9, 3 };
        int index = LinearSearch(data, 7);
        Console.WriteLine(index >= 0
            ? $"Element 7 found at index {index}."
            : "Element not found.");
    }
}
```

Sample output:

```text
Element 7 found at index 2.
```

### Binary search

Binary search finds a target value in a **sorted** array. It divides the search interval in half again and again.

```csharp
using System;

class Program
{
    static int BinarySearch(int[] arr, int target)
    {
        int left = 0, right = arr.Length - 1;
        while (left <= right)
        {
            int mid = (left + right) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    static void Main()
    {
        int[] sorted = { 1, 3, 5, 7, 9 };
        int idx = BinarySearch(sorted, 5);
        Console.WriteLine(idx >= 0
            ? $"Element 5 found at index {idx}."
            : "Element not found.");
    }
}
```

Sample output:

```text
Element 5 found at index 2.
```

## Sorting algorithms

### Bubble sort

Bubble sort goes through the list again and again. It compares adjacent elements and swaps them if they are in the wrong order.

```csharp
using System;

class Program
{
    static void BubbleSort(int[] arr)
    {
        int n = arr.Length;
        for (int i = 0; i < n - 1; i++)
            for (int j = 0; j < n - 1 - i; j++)
                if (arr[j] > arr[j + 1])
                    (arr[j], arr[j + 1]) = (arr[j + 1], arr[j]);
    }

    static void Main()
    {
        int[] nums = { 5, 2, 9, 1, 5, 6 };
        BubbleSort(nums);
        Console.WriteLine(string.Join(" ", nums));
    }
}
```

Sample output:

```text
1 2 5 5 6 9
```

### Merge sort

Merge sort is a divide-and-conquer algorithm. It splits the array in half, sorts each half recursively, and merges the sorted halves.

```csharp
using System;

class Program
{
    static void Merge(int[] arr, int left, int mid, int right)
    {
        int n1 = mid - left + 1, n2 = right - mid;
        int[] L = new int[n1], R = new int[n2];
        Array.Copy(arr, left, L, 0, n1);
        Array.Copy(arr, mid + 1, R, 0, n2);

        int i = 0, j = 0, k = left;
        while (i < n1 && j < n2)
            arr[k++] = L[i] <= R[j] ? L[i++] : R[j++];
        while (i < n1) arr[k++] = L[i++];
        while (j < n2) arr[k++] = R[j++];
    }

    static void MergeSort(int[] arr, int left, int right)
    {
        if (left >= right) return;
        int mid = (left + right) / 2;
        MergeSort(arr, left, mid);
        MergeSort(arr, mid + 1, right);
        Merge(arr, left, mid, right);
    }

    static void Main()
    {
        int[] data = { 3, 6, 1, 8, 4, 5 };
        MergeSort(data, 0, data.Length - 1);
        Console.WriteLine(string.Join(" ", data));
    }
}
```

Sample output:

```text
1 3 4 5 6 8
```

### Quick sort

Quick sort picks a pivot element and partitions the array around the pivot. Then it sorts the partitions recursively.

```csharp
using System;

class Program
{
    static void QuickSort(int[] arr, int low, int high)
    {
        if (low >= high) return;
        int pivot = arr[(low + high) / 2], i = low, j = high;
        while (i <= j)
        {
            while (arr[i] < pivot) i++;
            while (arr[j] > pivot) j--;
            if (i <= j)
            {
                (arr[i], arr[j]) = (arr[j], arr[i]);
                i++;
                j--;
            }
        }
        QuickSort(arr, low, j);
        QuickSort(arr, i, high);
    }

    static void Main()
    {
        int[] values = { 10, 7, 8, 9, 1, 5 };
        QuickSort(values, 0, values.Length - 1);
        Console.WriteLine(string.Join(" ", values));
    }
}
```

Sample output:

```text
1 5 7 8 9 10
```

> **NOTE:** Swap first, then move `i` and `j`. In a C# deconstruction assignment, the indexes on the left side are evaluated before the right side, so `(arr[i++], arr[j--]) = (arr[j], arr[i])` reads the wrong elements.

## Recursive patterns

### Fibonacci series

This algorithm makes the Fibonacci sequence. Each number is the sum of the 2 numbers before it.

Recursive version:

```csharp
using System;

class Program
{
    static int Fib(int n) => n <= 1 ? n : Fib(n - 1) + Fib(n - 2);

    static void Main()
    {
        int n = 10;
        for (int i = 0; i < n; i++)
            Console.Write(Fib(i) + " ");
    }
}
```

Iterative version:

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = 10;
        int a = 0, b = 1;
        Console.Write(a + " " + b + " ");
        for (int i = 2; i < n; i++)
        {
            int next = a + b;
            Console.Write(next + " ");
            a = b; b = next;
        }
    }
}
```

Sample output (both versions):

```text
0 1 1 2 3 5 8 13 21 34
```

### Factorial

This algorithm calculates `n!` (the product of all positive integers up to `n`) with recursion.

```csharp
using System;

class Program
{
    static long Factorial(int n) => n <= 1 ? 1 : n * Factorial(n - 1);

    static void Main()
    {
        Console.WriteLine(Factorial(5));
    }
}
```

Sample output:

```text
120
```

## Graph traversal

### Depth-first search

Depth-first search (DFS) follows each branch as far as possible before it goes back.

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void DFS(int u, bool[] visited, List<int>[] adj)
    {
        visited[u] = true;
        Console.Write(u + " ");
        foreach (var v in adj[u])
            if (!visited[v]) DFS(v, visited, adj);
    }

    static void Main()
    {
        int V = 5;
        var adj = new List<int>[V];
        for (int i = 0; i < V; i++) adj[i] = new List<int>();
        adj[0].AddRange(new[]{1, 2});
        adj[1].Add(3);
        adj[2].Add(4);

        bool[] visited = new bool[V];
        Console.Write("DFS starting from vertex 0: ");
        DFS(0, visited, adj);
    }
}
```

Sample output:

```text
DFS starting from vertex 0: 0 1 3 2 4
```

### Breadth-first search

Breadth-first search (BFS) visits all neighbors at the current depth before it moves to the next level.

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void BFS(int start, List<int>[] adj)
    {
        var visited = new bool[adj.Length];
        var queue = new Queue<int>();
        visited[start] = true;
        queue.Enqueue(start);

        Console.Write("BFS starting from vertex 0: ");
        while (queue.Count > 0)
        {
            int u = queue.Dequeue();
            Console.Write(u + " ");
            foreach (var v in adj[u])
                if (!visited[v])
                {
                    visited[v] = true;
                    queue.Enqueue(v);
                }
        }
    }

    static void Main()
    {
        int V = 5;
        var adj = new List<int>[V];
        for (int i = 0; i < V; i++) adj[i] = new List<int>();
        adj[0].AddRange(new[]{1, 2});
        adj[1].Add(3);
        adj[2].Add(4);

        BFS(0, adj);
    }
}
```

Sample output:

```text
BFS starting from vertex 0: 0 1 2 3 4
```

## Shortest-path algorithm

### Dijkstra's algorithm

Dijkstra's algorithm finds the shortest paths from a source vertex to all other vertices in a weighted graph. All weights must be zero or more.

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Dijkstra(int src, List<(int v, int w)>[] graph)
    {
        int n = graph.Length;
        var dist = new int[n];
        var pq = new SortedSet<(int d, int u)>();
        for (int i = 0; i < n; i++) dist[i] = int.MaxValue;
        dist[src] = 0;
        pq.Add((0, src));

        while (pq.Count > 0)
        {
            var (d, u) = pq.Min; pq.Remove(pq.Min);
            foreach (var (v, w) in graph[u])
            {
                int nd = d + w;
                if (nd < dist[v])
                {
                    pq.Remove((dist[v], v));
                    dist[v] = nd;
                    pq.Add((nd, v));
                }
            }
        }

        Console.WriteLine("Shortest distances from node 0:");
        for (int i = 0; i < n; i++)
            Console.WriteLine($"Vertex {i}: {dist[i]}");
    }

    static void Main()
    {
        int V = 8;
        var graph = new List<(int, int)>[V];
        for (int i = 0; i < V; i++) graph[i] = new List<(int, int)>();

        // sample weighted edges
        graph[0].Add((1, 4)); graph[0].Add((7, 8));
        graph[1].Add((2, 8)); graph[1].Add((7, 11));
        graph[2].Add((3, 7)); graph[2].Add((5, 4)); graph[2].Add((8 % V, 2));
        graph[3].Add((4, 9)); graph[3].Add((5, 14));
        graph[4].Add((5, 10));
        graph[5].Add((6, 2));
        graph[6].Add((7, 1)); graph[6].Add((8 % V, 6));
        graph[7].Add((8 % V, 7));

        Dijkstra(0, graph);
    }
}
```

Sample output:

```text
Shortest distances from node 0:
Vertex 0: 0
Vertex 1: 4
Vertex 2: 12
Vertex 3: 19
Vertex 4: 28
Vertex 5: 16
Vertex 6: 18
Vertex 7: 8
```

The edges are directed: each `graph[u].Add((v, w))` adds an edge from `u` to `v` only. `8 % V` is `0`, so those edges go back to vertex 0.

## Related links

- [Key Algorithms Developers Should Learn in 2025: Top 11 Picks](https://www.index.dev/blog/must-know-algorithms-for-developers#searching-algorithms)
- [C# cheat sheet](doc:csharp-cheatsheet)
