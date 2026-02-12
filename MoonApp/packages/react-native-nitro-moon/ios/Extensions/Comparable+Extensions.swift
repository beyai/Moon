

extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}

extension BinaryFloatingPoint {
    @inlinable
    func toFixed(_ len: Int) -> Self {
        guard len >= 0 else { return self }
        let factor = Self( pow(10.0, Double(len)) )
        return (self * factor).rounded() / factor
    }
}
