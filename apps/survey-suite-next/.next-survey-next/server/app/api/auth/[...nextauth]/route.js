/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "(rsc)/./app/api/auth/[...nextauth]/route.ts":
/*!*********************************************!*\
  !*** ./app/api/auth/[...nextauth]/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/auth */ \"(rsc)/./auth.ts\");\n\nconst { GET, POST } = _auth__WEBPACK_IMPORTED_MODULE_0__.handlers;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBa0M7QUFFM0IsTUFBTSxFQUFFQyxHQUFHLEVBQUVDLElBQUksRUFBRSxHQUFHRiwyQ0FBUUEsQ0FBQyIsInNvdXJjZXMiOlsiRDpcXHJhdmVsbG9cXE15X0FQUHNcXHJhdmVsbG9tLmdpdGh1Yi5pb1xccmF2ZWxsb20uZ2l0aHViLmlvXFxhcHBzXFxzdXJ2ZXktc3VpdGUtbmV4dFxcYXBwXFxhcGlcXGF1dGhcXFsuLi5uZXh0YXV0aF1cXHJvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGhhbmRsZXJzIH0gZnJvbSAnQC9hdXRoJztcblxuZXhwb3J0IGNvbnN0IHsgR0VULCBQT1NUIH0gPSBoYW5kbGVycztcbiJdLCJuYW1lcyI6WyJoYW5kbGVycyIsIkdFVCIsIlBPU1QiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/auth/[...nextauth]/route.ts\n");

/***/ }),

/***/ "(rsc)/./auth.ts":
/*!*****************!*\
  !*** ./auth.ts ***!
  \*****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   handlers: () => (/* binding */ handlers),\n/* harmony export */   signIn: () => (/* binding */ signIn),\n/* harmony export */   signOut: () => (/* binding */ signOut)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! zod */ \"(rsc)/./node_modules/zod/v3/types.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./lib/prisma.ts\");\n\n\n\n\n\nconst credentialsSchema = zod__WEBPACK_IMPORTED_MODULE_4__.object({\n    email: zod__WEBPACK_IMPORTED_MODULE_4__.string().email(),\n    password: zod__WEBPACK_IMPORTED_MODULE_4__.string().min(6)\n});\nconst { handlers, auth, signIn, signOut } = (0,next_auth__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n    session: {\n        strategy: 'jwt'\n    },\n    secret: process.env.AUTH_SECRET,\n    trustHost: true,\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            name: 'Credentials',\n            credentials: {\n                email: {\n                    label: 'Email',\n                    type: 'email'\n                },\n                password: {\n                    label: 'Password',\n                    type: 'password'\n                }\n            },\n            authorize: async (rawCredentials)=>{\n                const parsed = credentialsSchema.safeParse(rawCredentials);\n                if (!parsed.success) return null;\n                const { email, password } = parsed.data;\n                const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.findUnique({\n                    where: {\n                        email\n                    }\n                });\n                if (!user?.passwordHash) return null;\n                const isValid = await (0,bcryptjs__WEBPACK_IMPORTED_MODULE_2__.compare)(password, user.passwordHash);\n                if (!isValid) return null;\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.name,\n                    image: user.image\n                };\n            }\n        })\n    ],\n    callbacks: {\n        jwt: async ({ token, user })=>{\n            if (user) {\n                token.id = user.id;\n            }\n            return token;\n        },\n        session: async ({ session, token })=>{\n            if (session.user) {\n                session.user.id = String(token.id || '');\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: '/auth/login'\n    }\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hdXRoLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBaUM7QUFDeUI7QUFDdkI7QUFDWDtBQUNjO0FBRXRDLE1BQU1LLG9CQUFvQkYsdUNBQVEsQ0FBQztJQUNqQ0ksT0FBT0osdUNBQVEsR0FBR0ksS0FBSztJQUN2QkUsVUFBVU4sdUNBQVEsR0FBR08sR0FBRyxDQUFDO0FBQzNCO0FBRU8sTUFBTSxFQUFFQyxRQUFRLEVBQUVDLElBQUksRUFBRUMsTUFBTSxFQUFFQyxPQUFPLEVBQUUsR0FBR2QscURBQVFBLENBQUM7SUFDMURlLFNBQVM7UUFBRUMsVUFBVTtJQUFNO0lBQzNCQyxRQUFRQyxRQUFRQyxHQUFHLENBQUNDLFdBQVc7SUFDL0JDLFdBQVc7SUFDWEMsV0FBVztRQUNUckIsMkVBQVdBLENBQUM7WUFDVnNCLE1BQU07WUFDTkMsYUFBYTtnQkFDWGpCLE9BQU87b0JBQUVrQixPQUFPO29CQUFTQyxNQUFNO2dCQUFRO2dCQUN2Q2pCLFVBQVU7b0JBQUVnQixPQUFPO29CQUFZQyxNQUFNO2dCQUFXO1lBQ2xEO1lBQ0FDLFdBQVcsT0FBT0M7Z0JBQ2hCLE1BQU1DLFNBQVN4QixrQkFBa0J5QixTQUFTLENBQUNGO2dCQUMzQyxJQUFJLENBQUNDLE9BQU9FLE9BQU8sRUFBRSxPQUFPO2dCQUU1QixNQUFNLEVBQUV4QixLQUFLLEVBQUVFLFFBQVEsRUFBRSxHQUFHb0IsT0FBT0csSUFBSTtnQkFDdkMsTUFBTUMsT0FBTyxNQUFNN0IsK0NBQU1BLENBQUM2QixJQUFJLENBQUNDLFVBQVUsQ0FBQztvQkFBRUMsT0FBTzt3QkFBRTVCO29CQUFNO2dCQUFFO2dCQUM3RCxJQUFJLENBQUMwQixNQUFNRyxjQUFjLE9BQU87Z0JBRWhDLE1BQU1DLFVBQVUsTUFBTW5DLGlEQUFPQSxDQUFDTyxVQUFVd0IsS0FBS0csWUFBWTtnQkFDekQsSUFBSSxDQUFDQyxTQUFTLE9BQU87Z0JBRXJCLE9BQU87b0JBQ0xDLElBQUlMLEtBQUtLLEVBQUU7b0JBQ1gvQixPQUFPMEIsS0FBSzFCLEtBQUs7b0JBQ2pCZ0IsTUFBTVUsS0FBS1YsSUFBSTtvQkFDZmdCLE9BQU9OLEtBQUtNLEtBQUs7Z0JBQ25CO1lBQ0Y7UUFDRjtLQUNEO0lBQ0RDLFdBQVc7UUFDVEMsS0FBSyxPQUFPLEVBQUVDLEtBQUssRUFBRVQsSUFBSSxFQUFFO1lBQ3pCLElBQUlBLE1BQU07Z0JBQ1JTLE1BQU1KLEVBQUUsR0FBR0wsS0FBS0ssRUFBRTtZQUNwQjtZQUNBLE9BQU9JO1FBQ1Q7UUFDQTNCLFNBQVMsT0FBTyxFQUFFQSxPQUFPLEVBQUUyQixLQUFLLEVBQUU7WUFDaEMsSUFBSTNCLFFBQVFrQixJQUFJLEVBQUU7Z0JBQ2hCbEIsUUFBUWtCLElBQUksQ0FBQ0ssRUFBRSxHQUFHSyxPQUFPRCxNQUFNSixFQUFFLElBQUk7WUFDdkM7WUFDQSxPQUFPdkI7UUFDVDtJQUNGO0lBQ0E2QixPQUFPO1FBQ0wvQixRQUFRO0lBQ1Y7QUFDRixHQUFHIiwic291cmNlcyI6WyJEOlxccmF2ZWxsb1xcTXlfQVBQc1xccmF2ZWxsb20uZ2l0aHViLmlvXFxyYXZlbGxvbS5naXRodWIuaW9cXGFwcHNcXHN1cnZleS1zdWl0ZS1uZXh0XFxhdXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBOZXh0QXV0aCBmcm9tICduZXh0LWF1dGgnO1xuaW1wb3J0IENyZWRlbnRpYWxzIGZyb20gJ25leHQtYXV0aC9wcm92aWRlcnMvY3JlZGVudGlhbHMnO1xuaW1wb3J0IHsgY29tcGFyZSB9IGZyb20gJ2JjcnlwdGpzJztcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnO1xuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSAnQC9saWIvcHJpc21hJztcblxuY29uc3QgY3JlZGVudGlhbHNTY2hlbWEgPSB6Lm9iamVjdCh7XG4gIGVtYWlsOiB6LnN0cmluZygpLmVtYWlsKCksXG4gIHBhc3N3b3JkOiB6LnN0cmluZygpLm1pbig2KVxufSk7XG5cbmV4cG9ydCBjb25zdCB7IGhhbmRsZXJzLCBhdXRoLCBzaWduSW4sIHNpZ25PdXQgfSA9IE5leHRBdXRoKHtcbiAgc2Vzc2lvbjogeyBzdHJhdGVneTogJ2p3dCcgfSxcbiAgc2VjcmV0OiBwcm9jZXNzLmVudi5BVVRIX1NFQ1JFVCxcbiAgdHJ1c3RIb3N0OiB0cnVlLFxuICBwcm92aWRlcnM6IFtcbiAgICBDcmVkZW50aWFscyh7XG4gICAgICBuYW1lOiAnQ3JlZGVudGlhbHMnLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6ICdFbWFpbCcsIHR5cGU6ICdlbWFpbCcgfSxcbiAgICAgICAgcGFzc3dvcmQ6IHsgbGFiZWw6ICdQYXNzd29yZCcsIHR5cGU6ICdwYXNzd29yZCcgfVxuICAgICAgfSxcbiAgICAgIGF1dGhvcml6ZTogYXN5bmMgKHJhd0NyZWRlbnRpYWxzKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IGNyZWRlbnRpYWxzU2NoZW1hLnNhZmVQYXJzZShyYXdDcmVkZW50aWFscyk7XG4gICAgICAgIGlmICghcGFyc2VkLnN1Y2Nlc3MpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IHsgZW1haWwsIHBhc3N3b3JkIH0gPSBwYXJzZWQuZGF0YTtcbiAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBlbWFpbCB9IH0pO1xuICAgICAgICBpZiAoIXVzZXI/LnBhc3N3b3JkSGFzaCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3QgaXNWYWxpZCA9IGF3YWl0IGNvbXBhcmUocGFzc3dvcmQsIHVzZXIucGFzc3dvcmRIYXNoKTtcbiAgICAgICAgaWYgKCFpc1ZhbGlkKSByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGlkOiB1c2VyLmlkLFxuICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICAgIG5hbWU6IHVzZXIubmFtZSxcbiAgICAgICAgICBpbWFnZTogdXNlci5pbWFnZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pXG4gIF0sXG4gIGNhbGxiYWNrczoge1xuICAgIGp3dDogYXN5bmMgKHsgdG9rZW4sIHVzZXIgfSkgPT4ge1xuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgdG9rZW4uaWQgPSB1c2VyLmlkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH0sXG4gICAgc2Vzc2lvbjogYXN5bmMgKHsgc2Vzc2lvbiwgdG9rZW4gfSkgPT4ge1xuICAgICAgaWYgKHNlc3Npb24udXNlcikge1xuICAgICAgICBzZXNzaW9uLnVzZXIuaWQgPSBTdHJpbmcodG9rZW4uaWQgfHwgJycpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfVxuICB9LFxuICBwYWdlczoge1xuICAgIHNpZ25JbjogJy9hdXRoL2xvZ2luJ1xuICB9XG59KTtcbiJdLCJuYW1lcyI6WyJOZXh0QXV0aCIsIkNyZWRlbnRpYWxzIiwiY29tcGFyZSIsInoiLCJwcmlzbWEiLCJjcmVkZW50aWFsc1NjaGVtYSIsIm9iamVjdCIsImVtYWlsIiwic3RyaW5nIiwicGFzc3dvcmQiLCJtaW4iLCJoYW5kbGVycyIsImF1dGgiLCJzaWduSW4iLCJzaWduT3V0Iiwic2Vzc2lvbiIsInN0cmF0ZWd5Iiwic2VjcmV0IiwicHJvY2VzcyIsImVudiIsIkFVVEhfU0VDUkVUIiwidHJ1c3RIb3N0IiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwibGFiZWwiLCJ0eXBlIiwiYXV0aG9yaXplIiwicmF3Q3JlZGVudGlhbHMiLCJwYXJzZWQiLCJzYWZlUGFyc2UiLCJzdWNjZXNzIiwiZGF0YSIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJwYXNzd29yZEhhc2giLCJpc1ZhbGlkIiwiaWQiLCJpbWFnZSIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwiU3RyaW5nIiwicGFnZXMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./auth.ts\n");

/***/ }),

/***/ "(rsc)/./lib/prisma.ts":
/*!***********************!*\
  !*** ./lib/prisma.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) {\n    globalForPrisma.prisma = prisma;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvcHJpc21hLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUE4QztBQUU5QyxNQUFNQyxrQkFBa0JDO0FBRWpCLE1BQU1DLFNBQVNGLGdCQUFnQkUsTUFBTSxJQUFJLElBQUlILHdEQUFZQSxHQUFHO0FBRW5FLElBQUlJLElBQXFDLEVBQUU7SUFDekNILGdCQUFnQkUsTUFBTSxHQUFHQTtBQUMzQiIsInNvdXJjZXMiOlsiRDpcXHJhdmVsbG9cXE15X0FQUHNcXHJhdmVsbG9tLmdpdGh1Yi5pb1xccmF2ZWxsb20uZ2l0aHViLmlvXFxhcHBzXFxzdXJ2ZXktc3VpdGUtbmV4dFxcbGliXFxwcmlzbWEudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuXG5jb25zdCBnbG9iYWxGb3JQcmlzbWEgPSBnbG9iYWxUaGlzIGFzIHVua25vd24gYXMgeyBwcmlzbWE6IFByaXNtYUNsaWVudCB8IHVuZGVmaW5lZCB9O1xuXG5leHBvcnQgY29uc3QgcHJpc21hID0gZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA/PyBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBwcmlzbWE7XG59XHJcbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwicHJvY2VzcyIsImVudiIsIk5PREVfRU5WIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/prisma.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var D_ravello_My_APPs_ravellom_github_io_ravellom_github_io_apps_survey_suite_next_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"D:\\\\ravello\\\\My_APPs\\\\ravellom.github.io\\\\ravellom.github.io\\\\apps\\\\survey-suite-next\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.ts\",\n    nextConfigOutput,\n    userland: D_ravello_My_APPs_ravellom_github_io_ravellom_github_io_apps_survey_suite_next_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj1EJTNBJTVDcmF2ZWxsbyU1Q015X0FQUHMlNUNyYXZlbGxvbS5naXRodWIuaW8lNUNyYXZlbGxvbS5naXRodWIuaW8lNUNhcHBzJTVDc3VydmV5LXN1aXRlLW5leHQlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUQlM0ElNUNyYXZlbGxvJTVDTXlfQVBQcyU1Q3JhdmVsbG9tLmdpdGh1Yi5pbyU1Q3JhdmVsbG9tLmdpdGh1Yi5pbyU1Q2FwcHMlNUNzdXJ2ZXktc3VpdGUtbmV4dCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDOEU7QUFDM0o7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkQ6XFxcXHJhdmVsbG9cXFxcTXlfQVBQc1xcXFxyYXZlbGxvbS5naXRodWIuaW9cXFxccmF2ZWxsb20uZ2l0aHViLmlvXFxcXGFwcHNcXFxcc3VydmV5LXN1aXRlLW5leHRcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiRDpcXFxccmF2ZWxsb1xcXFxNeV9BUFBzXFxcXHJhdmVsbG9tLmdpdGh1Yi5pb1xcXFxyYXZlbGxvbS5naXRodWIuaW9cXFxcYXBwc1xcXFxzdXJ2ZXktc3VpdGUtbmV4dFxcXFxhcHBcXFxcYXBpXFxcXGF1dGhcXFxcWy4uLm5leHRhdXRoXVxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/server/app-render/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/action-async-storage.external.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@prisma/client");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/zod","vendor-chunks/jose","vendor-chunks/oauth4webapi","vendor-chunks/bcryptjs","vendor-chunks/preact","vendor-chunks/preact-render-to-string","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5Cravello%5CMy_APPs%5Cravellom.github.io%5Cravellom.github.io%5Capps%5Csurvey-suite-next&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();