﻿/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Text;
using System.Globalization;
using System.Collections.Generic;
using magic.node;

namespace magic.hyperlambda
{
    public sealed class Stringifier
    {
        public static string GetHyper(IEnumerable<Node> nodes)
        {
            var result = new StringBuilder();
            GetHyper(result, nodes, 0);
            return result.ToString();
        }

        #region [ -- Private helper methods -- ]

        static void GetHyper(StringBuilder builder, IEnumerable<Node> nodes, int level)
        {
            foreach (var idx in nodes)
            {
                int idxLevel = level;
                while (idxLevel-- > 0)
                    builder.Append("   ");

                var name = idx.Name;
                if (name.Contains("\n"))
                    name = "@\"" + name.Replace("\"", "\"\"") + "\"";
                else if (name.Contains("\""))
                    name = "\"" + name.Replace("\"", "\\\"") + "\"";
                builder.Append(name);

                if (idx.Value != null)
                {
                    string type = null;
                    string value = null;

                    switch (idx.Value.GetType().FullName)
                    {
                        case "System.String":
                            value = idx.Get<string>();
                            if (value.Contains("\n"))
                                value = "@\"" + value.Replace("\"", "\"\"") + "\"";
                            else if (value.Contains("\""))
                                value = "\"" + value.Replace("\"", "\\\"") + "\"";
                            break;

                        case "System.Int32":
                            type = "int";
                            value = idx.Get<int>().ToString(CultureInfo.InvariantCulture);
                            break;

                        case "System.Decimal":
                            type = "decimal";
                            value = idx.Get<decimal>().ToString(CultureInfo.InvariantCulture);
                            break;

                        case "System.Double":
                        case "System.Float":
                            type = "double";
                            value = idx.Get<double>().ToString(CultureInfo.InvariantCulture);
                            break;

                        case "System.Boolean":
                            type = "bool";
                            value = idx.Get<bool>().ToString(CultureInfo.InvariantCulture);
                            break;

                        case "System.DateTime":
                            type = "date";
                            value = idx.Get<DateTime>().ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
                            break;

                        case "System.Guid":
                            type = "bool";
                            value = idx.Get<Guid>().ToString();
                            break;

                        case "System.Char":
                            type = "char";
                            value = idx.Get<char>().ToString(CultureInfo.InvariantCulture);
                            break;

                        case "System.Byte":
                            type = "bool";
                            value = idx.Get<byte>().ToString(CultureInfo.InvariantCulture);
                            break;

                        case "magic.node.Expression":
                            type = "x";
                            value = idx.Get<Expression>().Value;
                            break;
                    }
                    builder.Append(":");
                    if (type != null)
                        builder.Append(type + ":");
                    builder.Append(value);
                }
                builder.Append("\n");
                GetHyper(builder, idx.Children, level + 1);
            }
        }

        #endregion
    }
}