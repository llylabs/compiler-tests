package main

import "fmt"

func main() {
	m := map[string]int{"a": 1, "b": 2, "c": 3}
	keys := []string{"a", "b", "c"}
	total := 0
	for _, k := range keys {
		total += m[k]
	}
	fmt.Println("total=", total)
}
