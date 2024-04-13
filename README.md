## 使用说明

```ts
import {FetchRequest} from "@coderlzw/request"

const myRequest = new FetchRequest({
    baseURL: '/api',
    timeout: 5000,  // 超时的请求会被取消
    interceptors: {
        requestInterceptor: (request) => {
            // 01、return Promise.reject("请求不会被发送，会进入requestInterceptorCatch");
            // 02、throw new Error("请求不会被发送，会进入requestInterceptorCatch");
            // 03、return request;  这里只能返回request对象，不能返回其他类型
            // 04、默认返回 request
        },
        requestInterceptorCatch: (requestCatch) => {
            // 01、throw new Error(requestCatch.message);
            // 02、return Promise.reject(requestCatch.message); 
            // 03、不允许返回其他类型、默认是 throw new Error(error.message);
        },
        responseInterceptor: (response) => {
            // 自由发挥、默认会根据响应头的content-type来判断是否需要转换数据，如果都不符合则返回response
            // application/json; charset=utf-8   ->  response.json()
            // text/html; charset=utf-8           ->  response.text()
            // image/*                        ->  response.blob()
            // application/octet-stream          ->  response.blob()
        },
        responseInterceptorCatch: (responseCatch) => {
            // 01、throw new Error(responseCatch.message);
            // 02、return Promise.reject(responseCatch.message);
            // 03、默认 throw new Error(responseCatch.message)
        }
    },
});

export default myRequest;
```

```ts
interface ResponseData<T = any> {
    code: number;
    data: T;
    message: string;
}

interface RequestParams {
    id: number;
}

interface RequestBody {
    name: string;
    age: number;
}

myRequest.get<ResponseData, RequestParams>('/posts', {params: {id: 1}}).then((res) => {
    console.log(res);
}).catch((err) => {
    console.log(err);
});

myRequest.post<ResponseData, RequestBody, RequestParams>('/user', {
    params: {id: 1},
    body: {
        name: "zs",
        age: 20
    }
}).then((res) => {
    console.log(res);
}).catch((err) => {
    console.log(err);
});

myRequest.fetch<ResponseData, RequestParams, RequestBody>("/posts111?id=1", {
    method: "POST",
    params: {
        name: "zhangsan"
    },
    body: {
        name: "zhangsan"
    }
}).then((res) => {
    console.log(res);
}).catch((err) => {
    console.log("FETCH_ERROR=============:", err);
});
```

# 文件下载

```ts
myRequest.fetch<Uint8Array>("/installer/XELive3.6.0.1-X64.exe", {
    onProgress(progress) {
        console.log("下载进度：", progress);
    },
}).then((res) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([res]));
    a.download = "XELive3.6.0.1-X64.exe";
    a.click();
}).catch((err) => {
    console.log("请求失败", err)
})
```

如果不传递onProgress，则返回Blob类型的数据

```ts
myRequest.fetch<Blob>("/installer/XELive3.6.0.1-X64.exe", {}).then((res) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res);
    a.download = "XELive3.6.0.1-X64.exe";
    a.click();
}).catch((err) => {
    console.log("请求失败", err)
})
```
