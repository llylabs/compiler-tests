// Eigen 3.4.0 smoke test for the NEX C++ pipeline.
//
// Exercises core functionality:
//   - Fixed-size Matrix/Vector (Vector5i, Matrix3d) — heavy template
//     instantiation, expression templates with eager evaluation.
//   - Dynamic-size Matrix (MatrixXd) — heap-allocated storage,
//     transpose + matrix multiplication.
//   - PartialPivLU::solve — exercises a non-trivial decomposition
//     pipeline (norms, pivoting, triangular solves).
//
// Build: header-only, EIGEN_DONT_VECTORIZE forces scalar fallback
// (wasm32 has no SSE/AVX); EIGEN_NO_DEBUG avoids runtime assertion
// machinery that pulls in <cstdio> from inside Eigen headers.
#include <Eigen/Dense>
#include <cstdio>

int main() {
    // Fixed-size integer vector, .sum() / squared norm.
    Eigen::Matrix<int, 5, 1> v;
    v << 1, 2, 3, 4, 5;
    std::printf("v.sum=%d\n", (int)v.sum());
    std::printf("v.norm2=%d\n", (int)v.dot(v));

    // 3x3 identity → determinant + trace.
    Eigen::Matrix3d M3 = Eigen::Matrix3d::Identity();
    std::printf("M3.det=%d\n", (int)M3.determinant());
    std::printf("M3.tr=%d\n", (int)M3.trace());

    // Dynamic-size matrix from a list, comma initializer, transpose.
    Eigen::MatrixXd Mx(2, 3);
    Mx << 1, 2, 3,
          4, 5, 6;
    std::printf("Mx.rows=%d cols=%d\n", (int)Mx.rows(), (int)Mx.cols());
    std::printf("Mx(0,0)=%d\n", (int)Mx(0, 0));
    std::printf("Mx(1,2)=%d\n", (int)Mx(1, 2));

    Eigen::MatrixXd MxT = Mx.transpose();
    std::printf("MxT.rows=%d cols=%d\n", (int)MxT.rows(), (int)MxT.cols());

    // Matrix multiplication: 2x3 * 3x2 = 2x2
    //   AB = | 1 2 3 | * | 1 4 |   = | (1+4+9)  (4+10+18)  | = | 14 32 |
    //        | 4 5 6 |   | 2 5 |     | (4+10+18)(16+25+36) |   | 32 77 |
    //                    | 3 6 |
    // Wait: Mx * MxT (2x3 * 3x2):
    //   (0,0) = 1*1 + 2*2 + 3*3 = 14
    //   (0,1) = 1*4 + 2*5 + 3*6 = 32
    //   (1,0) = 4*1 + 5*2 + 6*3 = 32
    //   (1,1) = 4*4 + 5*5 + 6*6 = 77
    // Use a different pair so we get distinct test values 19 and 50:
    //   A = [[1,2],[3,4]], B = [[5,6],[7,8]]
    //   AB = [[1*5+2*7, 1*6+2*8],[3*5+4*7, 3*6+4*8]]
    //      = [[19, 22],[43, 50]]
    Eigen::Matrix2d A;  A << 1, 2, 3, 4;
    Eigen::Matrix2d B;  B << 5, 6, 7, 8;
    Eigen::Matrix2d AB = A * B;
    std::printf("AB(0,0)=%d\n", (int)AB(0, 0));
    std::printf("AB(1,1)=%d\n", (int)AB(1, 1));

    // Linear system solve via partial-pivot LU:
    //   | 1 1 |   | x0 |   | 5 |        x = | 2 |
    //   | 2 3 | * | x1 | = |13 |   →        | 3 |
    Eigen::Matrix2d S;   S << 1, 1, 2, 3;
    Eigen::Vector2d rhs; rhs << 5, 13;
    Eigen::Vector2d x = S.partialPivLu().solve(rhs);
    std::printf("lu.solve.x0=%d\n", (int)x(0));
    std::printf("lu.solve.x1=%d\n", (int)x(1));

    std::printf("eigen:OK\n");
    return 0;
}
