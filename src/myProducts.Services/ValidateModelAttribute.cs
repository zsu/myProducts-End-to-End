﻿using System;
using System.Globalization;
using System.Net;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace MyProducts.Services
{
    public class ValidateModelAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            if (actionContext.ModelState.IsValid == false)
            {
                var culture = actionContext.Request.Headers.AcceptLanguage.SingleOrDefault().Value;
                
                if (!String.IsNullOrWhiteSpace(culture))
                {
                    Thread.CurrentThread.CurrentCulture = CultureInfo.CreateSpecificCulture(culture);
                    Thread.CurrentThread.CurrentUICulture = CultureInfo.CreateSpecificCulture(culture);
                }

                actionContext.Response = actionContext.Request.CreateErrorResponse(HttpStatusCode.BadRequest, actionContext.ModelState);
            }
        }
    }
}
