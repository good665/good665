// package com.tansong.good665.example;

// import java.util.Scanner;
// import org.junit.jupiter.api.Test;
// import java.io.BufferedReader;
// import java.io.InputStream;
// import java.io.IOException;
// import java.util.StringTokenizer;

// import org.springframework.boot.test.context.SpringBootTest;

// @SpringBootTest

// public class JAVAtest2 {
    
//     //두 정수 A와 B가 주어졌을 때, A와 B를 비교하는 프로그램을 작성하시오.
//     //1 2
//     //<

//     //10 2
//     //>

//     //5 5
//     //==
//     @Test
// 	public void contextLoads2_1330() {
//         Scanner sc = new Scanner(System.in);
//         int A = sc.nextInt();
//         int B = sc.nextInt();
        
//         if(A > B){
//             System.out.println(A);
//         } else{
//             System.out.println(B);
//         }

//     }

//     //시험 점수를 입력받아 90 ~ 100점은 A, 
//     //80 ~ 89점은 B, 70 ~ 79점은 C, 
//     //60 ~ 69점은 D, 나머지 점수는 F를 출력하는 프로그램을 작성하시오.
//     //100
//     //A
//     @Test
// 	public void contextLoads2_9498() {
//         Scanner sc = new Scanner(System.in);
//         int A = sc.nextInt();
//         System.out.println((A >= 90)? "A" : (A>=80)? "B": (A>=70)?"C": (A>=60)?"D": "F" );
//     }   
//    // 연도가 주어졌을 때, 윤년이면 1, 아니면 0을 출력하는 프로그램을 작성하시오.
//     // 윤년은 연도가 4의 배수이면서, 
//     // 100의 배수가 아닐 때 또는 400의 배수일 때이다.
//     // 예를 들어, 2012년은 4의 배수이면서 100의 배수가 아니라서 윤년이다. 
//     // 1900년은 100의 배수이고 400의 배수는 아니기 때문에 윤년이 아니다. 
//     // 하지만, 2000년은 400의 배수이기 때문에 윤년이다.
//     //2000
//     //1
//     //1999
//     //0
//     @Test //retest
// 	public void contextLoads2_2753() {
//         Scanner sc = new Scanner(System.in);
//         int y = sc.nextInt();

//         if(y%4 == 0){
//            if(y%400 == 0) System.out.println("1");
//            else if (y%100==0) System.out.println("0");
//            else System.out.println("1");
//     }
//     else System.out.println("0");
// }

//     // 예를 들어, 좌표가 (12, 5)인 
//     // 점 A는 x좌표와 y좌표가 모두 양수이므로 제1사분면에 속한다. 
//     // 점 B는 x좌표가 음수이고 y좌표가 양수이므로 제2사분면에 속한다.
//     //점 (x, y)의 사분면 번호(1, 2, 3, 4 중 하나)를 출력한다.
//     //12
//     //5

//     //1

//     // 9
//     // -13

//     //4
//     @Test
// 	public void contextLoads2_14681() {
//         Scanner sc = new Scanner(System.in);
//         int x = sc.nextInt();
//         int y = sc.nextInt();

//         if(x > 0){
//             if(y > 0){
//                 System.out.println(1);
//             }
//             else{
//                 System.out.println(4);
//             }
//         }

//         else {
//             if(y > 0) {
//                 System.out.println(2);
//             }
//             else {
//                 System.out.println(3);
//             }
//         }
//     }
    
//     //45분 일찍 알람 설정하기"이다.

//     // 이 방법은 단순하다. 
//     // 원래 설정되어 있는 알람을 45분 앞서는 시간으로 바꾸는 것이다
//     // 첫째 줄에 상근이가 창영이의 방법을 사용할 때,
//     //  설정해야 하는 알람 시간을 출력한다. 
//     // (입력과 같은 형태로 출력하면 된다.)
//     //10 10
//     //9 25

//     //0 30
//     //23 45

//     //23 40
//     //22 55
//     @Test
// 	public void contextLoads2_2884() {
//         Scanner sc = new Scanner(System.in);
//         int H = sc.nextInt();
//         int M = sc.nextInt();

//         if(H < 45) {
//             H--; //시 1 감소
//             M = 60 - (45 - M); //분 감소
//             if(H < 0){
//                 H = 23;
//             }
//             System.out.println(H + " " + M);
//         }
//         else {
//             System.out.println(H + " " + (H-45));
//         }

//     }
//     // 훈제오리구이를 시작하는 시각과 오븐구이를 하는 데 
//     // 필요한 시간이 분단위로 주어졌을 때, 
//     // 오븐구이가 끝나는 시각을 계산하는 프로그램을 작성하시오.
//     //14 30
//     //20

//     //14 50

//     // 17 40
//     // 80

//     //19 0

//     // 23 48
//     // 25

//     //0 13

//     @Test
// 	public void contextLoads2_2525() {
        
//     }
//     // 같은 눈이 3개가 나오면 10,000원+(같은 눈)×1,000원의 상금을 받게 된다.
//     // 같은 눈이 2개만 나오는 경우에는 1,000원+(같은 눈)×100원의 상금을 받게 된다.
//     // 모두 다른 눈이 나오는 경우에는 (그 중 가장 큰 눈)×100원의 상금을 받게 된다.
//     //3 3 6
//     //1300

//     //2 2 2
//     //12000

//     //6 2 5
//     //600
//     @Test
// 	public void contextLoads2_2480() {
//         //BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
//     }


// }
